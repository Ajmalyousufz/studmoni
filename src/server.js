const dbPromise = indexedDB.open("AppDB", 1);

// Handle database upgrade
dbPromise.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (!db.objectStoreNames.contains("users")) {
        const store = db.createObjectStore("users", { keyPath: "phone" }); // Phone as unique identifier
        store.createIndex("isLoggedIn", "is_logged_in", { unique: false }); // Login state
    }
};

// Handle database errors
dbPromise.onerror = (event) => {
    console.error("IndexedDB error:", event.target.error);
};

// Open database successfully
dbPromise.onsuccess = () => {
    console.log("Database initialized successfully.");
};
