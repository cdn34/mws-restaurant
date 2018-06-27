const dbPromise = idb.open('test-db', 2, upgradeDb => {
    switch(upgradeDb.oldVersion) {
        case 0: 
            upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
        case 1:
            upgradeDb.createObjectStore('reviews', { keyPath: 'id' });

    }
});

class Idb {
    static async insert ( database, data ) {
        const db = await dbPromise;
        const tx = db.transaction(database,'readwrite');
        const restaurantsStore = tx.objectStore(database);
        data.forEach( restaurant => {
            restaurantsStore.put(restaurant);
        });
        return tx.complete;
    }

    static async getAll (database) {
        const db = await dbPromise;
        const tx = db.transaction(database);
        const restaurantsStore = tx.objectStore(database);
        return restaurantsStore.getAll();
    }
}

