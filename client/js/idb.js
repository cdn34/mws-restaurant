const dbPromise = idb.open('test-db', 3, upgradeDb => {
    switch(upgradeDb.oldVersion) {
        case 0: 
            upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
        case 1:
            upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
        case 2:
            upgradeDb.createObjectStore('offline-reviews', { keyPath: 'id' });

    }
});

class Idb {
    static async insert ( database, data ) {
        const db = await dbPromise;
        const tx = db.transaction(database,'readwrite');
        const store = tx.objectStore(database);
        data.forEach( restaurant => {
            store.put(restaurant);
        });
        return tx.complete;
    }

    static async getAll (database) {
        const db = await dbPromise;
        const tx = db.transaction(database);
        const store = tx.objectStore(database);
        return store.getAll();
    }

    static async delete (database, key) {
        const db = await dbPromise;
        const tx = db.transaction(database,'readwrite');
        const store = tx.objectStore(database);
        return store.delete(key);
    }
}

