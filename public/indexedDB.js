const request = window.indexedDB.open("budgetAppOfflineDB", 1);
let db;

// if the DB does not exist this will fire, THEN onsuccess
request.onupgradeneeded = ({ target }) => {
  console.log(`IndexedDB ONUPGRADENEEDED registered`);

  // set up indexedDB Schema
  db = target.result;

  const txObjectStore = db.createObjectStore(`transactions`, { keyPath: "name" });

  const unsavedTxObjectStore = db.createObjectStore(`unsavedTransactions`, { keyPath: "name" });

  txObjectStore.createIndex("allTx", "name")
  unsavedTxObjectStore.createIndex("unsavedTx", "name")
}

// if the DB does exist then this will fire first
request.onsuccess = (event) => {
  console.log(`\n\nIndexedDB ONSUCCESS registered, database successfully opened\n\n`);

  // assign the global db variable to the budgetAppOfflineIndexedDB
  db = event.target.result;
  console.log(event.target.result)
  console.log(db)

  let internetConnection = InternetConnectionCheck();
  if (internetConnection) {
    console.log(`INTERNET CONNECTIVITY DETECTED`);
    syncUnsavedTransactions();
    return;
  }
  console.log(`NO INTERNET CONNECTIVITY`);
  return;
}


function InternetConnectionCheck() {
  return navigator.onLine;
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
        return;
      }
    }
    console.log(`NO UNSAVED TRANSACTIONS WERE FOUND`)
  };

  unsavedTransactions.onerror = (err) => console.log(`ERROR ACCESSING UNSAVED TRANSACTIONS: `, err);
};



function saveRecord(transaction) {
  console.log(`saveRecord FIRED`);
  console.log(transaction);
  console.log(db);
  const dbTransaction = db.transaction([`transactions`], 'readwrite');

  const transactionsStore = dbTransaction.objectStore(`transactions`);

  const addRecordTransaction = transactionsStore.add(transaction);

  addRecordTransaction.onerror = event => {
    console.log(`AN ERROR OCCURED DURING DBTRANSACTION`)
    console.log(event)
    console.log(event.error)
  };

  addRecordTransaction.oncomplete = event => {
    console.log(`DB TRANSACTION COMPLETE`)
    console.log(event)
  };

  addRecordTransaction.onsuccess = event => {
    console.log(`saveRecord dbTransaction ONSUCCESS registered`);
    console.log(`RECORD ADDED TO INDEXEDDB "TRANSACTIONS" STORE.`);
  }
};

function saveRecordForLaterSyncing(transaction) {
  console.log(`saveRecordForLaterSyncing FIRED`);
  console.log(transaction);

  const dbTransaction = db.transaction([`unsavedTransactions`], 'readwrite');

  const transactionsStore = dbTransaction.objectStore(`unsavedTransactions`);

  const addRecordTransaction = transactionsStore.add(transaction);

  addRecordTransaction.onerror = event => {
    console.log(`AN ERROR OCCURED DURING DBTRANSACTION`)
    console.log(event)
    console.log(event.error)
  };

  addRecordTransaction.oncomplete = event => {
    console.log(`DB TRANSACTION COMPLETE`)
    console.log(event)
  };

  addRecordTransaction.onsuccess = event => {
    console.log(`saveRecordForLaterSyncing dbTransaction ONSUCCESS registered`);
    console.log(`RECORD ADDED TO INDEXEDDB "UNSAVEDTRANSACTIONS" STORE.`);
  }
}

// NEED TO WRITE A FUNCTION TO QUERY ALL INDEXEDDB DATA
function queryAllRecords() {

}
