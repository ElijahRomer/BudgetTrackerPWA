const request = indexedDB.open("budgetAppOfflineDB", 1);
let db;

// if the DB does not exist this will fire, THEN onsuccess
request.onupgradeneeded = ({ target }) => {
  console.log(`IndexedDB ONUPGRADENEEDED registered`);

  // set up indexedDB Schema
  db = target.result;

  const txObjectStore = db.createObjectStore(`transactions`, { keyPath: "name" });

  const unsavedTxObjectStore = db.createObjectStore(`unsavedTransactions`, { keyPath: "name" });

  unsavedTxObjectStore.createIndex("unsavedTx", "name")
}

// if the DB does exist then this will fire first
request.onsuccess = (event) => {
  console.log(`IndexedDB ONSUCCESS registered`);
  db = event.target.result;
  let internetConnection = InternetConnectionCheck();
  if (internetConnection) {
    syncUnsavedTransactions();
  }
  return;
}


function InternetConnectionCheck() {
  if (navigator.onLine) {
    console.log(`INTERNET CONNECTIVITY DETECTED`);
    return true;
  }
  console.log(`NO INTERNET CONNECTIVITY`);
  return false;
}

function syncUnsavedTransactions() {
  console.log(`syncUnsavedTransactions FIRED`)
  const dbTransaction = db.transaction([`unsavedTransactions`], 'readwrite');
  const unsavedTxObjectStore = dbTransaction.objectStore('unsavedTransactions');

  const unsavedTransactions = unsavedTxObjectStore.getAll();

  unsavedTransactions.onsuccess = async () => {
    console.log(`UNSAVED TRANSACTIONS ARE AS FOLLOWS`)
    console.log(unsavedTransactions.result)
    console.log(`length `, unsavedTransactions.result.length)

    if (unsavedTransactions.result.length) {
      const response = await fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(unsavedTransactions.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .catch(err => console.log(`FAILED TO POST UNSAVED TRANSACTIONS, `, err));

      if (response.ok) {
        const clearUnsavedTx = unsavedTxObjectStore.clear();

        clearUnsavedTx.onsuccess = () => {
          console.log(`UNSAVED TRANSACTIONS SAVED TO SERVER, UNSAVED TRANSACTIONS IN INDEXED DB CLEARED.`);
          return;
        }
      }
    }
    console.log(`NO UNSAVED TRANSACTIONS WERE FOUND`)
  };

  unsavedTransactions.onerror = (err) => console.log(`ERROR ACCESSING UNSAVED TRANSACTIONS: `, err);

}





function saveRecord(transaction) {
  // TODO: Write saveRecord Function to save offline transaction to indexedDB
  console.log(`NO CONNECTION, saveRecord FIRED`);
  console.log(transaction);


  // request.onupgradeneeded = ({ target }) => {
  //   console.log(`IndexedDB ONUPGRADENEEDED registered`);
  //   const db = target.result;
  //   const objectStore = db.createObjectStore(`transactions`, { keyPath: "name" });
  //   objectStore.createIndex("unsavedTx", "name")
  // }

  request.onsuccess = event => {
    console.log(`IndexedDB ONSUCCESS registered`);
    db = request.result;
    const dbTransaction = db.transaction([`transactions`], 'readwrite');
    const transactionsStore = dbTransaction.objectStore(`transactions`);
    console.log(transactionsStore);
    transactionsStore.add(transaction);

    dbTransaction.oncomplete = (e) => {
      console.log(`RECORD ADDED TO INDEXEDDB`);
      console.log(e);
    };

    dbTransaction.onerror = (err) => {
      console.log(err);
    }

  }

}

// NEED TO WRITE A FUNCTION TO QUERY ALL INDEXEDDB DATA
function queryAllRecords() {

}
