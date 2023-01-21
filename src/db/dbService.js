import pgPromise from 'pg-promise';
import bluebird from 'bluebird';

export const pgp = pgPromise({
    promiseLib: bluebird,
    capSQL: true
});

class DbService {
    constructor() {
        this.db = pgp('postgres://docker:docker@localhost:5432/docker');
        this.pgp = pgp;
    }
}

export const dbService = new DbService();
