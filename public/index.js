let transactions = [];
let myChart;

fetch("/api/transaction")
  .then(response => {
    return response.json();
  })
  .then(data => {
    // save db data on global variable
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  })
  .catch(async err => {
    // FETCH REQUEST FAILED, PULL RESULTS FROM INDEXEDDB
    // console.log(`FETCH REQUEST FAILED, PULL RESULTS FROM INDEXEDDB`)
    console.log(err);
    const offlineTX = queryAllRecordsIDB();

    offlineTX.onsuccess = (event) => {
      // console.log(`queryAllRecordsIDB ONSUCCESS FIRED`)
      console.log(event.target.result)
      console.log(typeof event.target.result)
      console.log(event.target.result.length)

      sortedTransactions = event.target.result.sort((a, b) => a.date - b.date)

      console.log(`\n\n SORTED TRANSACTIONS ARE AS FOLLOWS \n\n`)
      console.log(sortedTransactions)

      // save indexeddb data on global variable
      transactions = sortedTransactions;

      // update chart
      populateTotal();
      populateTable();
      populateChart();
    };

    offlineTX.onerror = (event) => {
      console.log(`An error occured reading entries in indexedDB.`);
      console.log(err);

    };
  })

function populateTotal() {
  // reduce transaction amounts to a single total value
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach(transaction => {
    // create and populate a table row
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // copy array and reverse it
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // create date labels for chart
  let labels = reversed.map(t => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // create incremental values for chart
  let data = reversed.map(t => {
    sum += parseInt(t.value);
    return sum;
  });

  // remove old chart if it exists
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: "Total Over Time",
        fill: true,
        backgroundColor: "#6666ff",
        data
      }]
    }
  });
}

async function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  }
  else {
    errorEl.textContent = "";
  }

  // create record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString()
  };

  // if subtracting funds, convert amount to negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // add to beginning of current array of data
  transactions.unshift(transaction);

  // re-run logic to populate ui with new record
  populateChart();
  populateTable();
  populateTotal();

  // save record to indexedDB
  saveRecord(transaction);

  // also send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      return response.json();
    })
    .then(data => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      }
      else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch(err => {
      // clear form
      nameEl.value = "";
      amountEl.value = "";

      // fetch failed, so save so it can be synced to server later 
      saveRecordForLaterSyncing(transaction);
    });
};




document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};
