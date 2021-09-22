let _db;

const mongoConnect = (callback) => {
    MongoClient.connect(
        process.env.DB_CONNECTION
    )
        .then(client => {
            console.log('connected')
            _db = client.db();
            callback()
        })
        .catch(err => {
            console.log(err)
            throw err;
        });
}

const getDb = () => {
    if (_db) {
        return _db
    }
    throw 'No found db!'
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;