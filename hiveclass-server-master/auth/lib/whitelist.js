const { MongoClient } = require('mongodb');

class WhitelistService {
    constructor(dbUrl) {
        this.dbUrl = dbUrl;
        this._clientPromise = null;
        this._db = null;
        this._collection = null;
        this._connect();
    }

    async _connect() {
        try {
            const client = await MongoClient.connect(this.dbUrl);
            this._db = client.db();
            this._collection = this._db.collection('client');
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    async _ensureConnected() {
        if (!this._collection) {
            await this._connect();
        }
    }

    async isDomainAuthorized(domain) {
        if (!domain) {
            return false;
        }

        await this._ensureConnected();
        const count = await this._collection.countDocuments({ domains: domain, active: true });
        return count > 0;
    }

    async createClient(clientName) {
        if (!clientName) {
            return 400;
        }

        await this._ensureConnected();
        const count = await this._collection.countDocuments({ name: clientName });

        if (count > 0) {
            return 409;
        }

        await this._collection.insertOne({ name: clientName, active: true });
        return 201;
    }

    async addDomainsToClient(clientName, domains) {
        if (typeof domains === 'string') {
            domains = [domains];
        }

        await this._ensureConnected();
        const updatePromises = domains.map(domain =>
            this._collection.findOneAndUpdate(
                { name: clientName },
                { $addToSet: { domains: domain } }
            )
        );

        await Promise.all(updatePromises);
        return 204;
    }

    async setClientActiveStatus(clientName, activeStatus) {
        await this._ensureConnected();
        await this._collection.findOneAndUpdate(
            { name: clientName },
            { $set: { active: activeStatus } }
        );
        return 204;
    }

    async getClients() {
        await this._ensureConnected();
        const clients = await this._collection.find({}, { projection: { name: 1 } }).toArray();
        return clients.map(x => x.name);
    }

    async getClient(clientName) {
        await this._ensureConnected();
        const clients = await this._collection.find({ name: clientName }).toArray();
        return clients.map(x => ({
            name: x.name,
            domains: x.domains,
            active: !!x.active
        }))[0];
    }
}

exports.WhitelistService = WhitelistService;
