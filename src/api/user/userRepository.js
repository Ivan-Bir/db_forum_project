// import UserModel from "./userModel";
import { ResponseModel } from "../commonModels/responseModel.js";
import { dbService } from "../../db/dbService.js";
import { validate } from "../utils/utils.js";

class UserRepository {
    constructor() {
        this.dbCon = dbService;
    }

    async create(user) {
        const result = new ResponseModel();
        const { fullname, email, about, nickname } = user.props;
        console.log('IN create:', fullname, email, about, nickname);

        try {
            await this.dbCon.db.none(`INSERT INTO users (nickname, about, fullname, email) VALUES ($1, $2, $3, $4)`, [nickname, about, fullname, email]);
            result.update({ status: 201, body: user.props });
        } catch (error) {
            result.update({ status: 500, body: { message: error.message } });
        }

        return result
    };

    async getByNickname(nickname) {
        try {
            return await this.dbCon.db.oneOrNone(`SELECT id, nickname, fullname, email, about FROM users WHERE nickname = $1`, [nickname]);
        } catch (error) {
            console.log('ERROR: getByNickname', error.message);
        }
    }

    async update(user) {
        try {
            const column_set = new this.dbCon.pgp.helpers.ColumnSet([
                validate('nickname'), validate('about'),
                validate('fullname'), validate('email')
            ], {table: 'users'});

            let query = this.dbCon.pgp.helpers.update(
                user.props,
                column_set,
                null,
                {emptyUpdate: true}
            );

            if (query === true) {
                return true;
            } else {
                query += ` WHERE \"nickname\" = \'${user.props.nickname}\' RETURNING nickname, fullname, about, email`;
            }

            return await this.dbCon.db.oneOrNone(query);

        } catch (error) {
            console.log('ERROR: update user', error.message);
        }
    }

    async getUsersByEmailOrNickname(email, nickname) {
        try {
            return await this.dbCon.db.manyOrNone(`SELECT nickname, email, about, fullname FROM users WHERE nickname = $1 OR email = $2`, [nickname, email]);
            // return await this.dbCon.db.manyOrNone(`SELECT * FROM users`);
        } catch (error) {
            console.log('ERROR: getUsersByEmailOrNickname', error.message);
        }
    }

    async getUsersFromForum(forum, params) {
        let { limit, since, desc } = params;
        // let query = 'SELECT user.id, user.nickname, user.fullname, user.about, user.email FROM users JOIN forum_users ON forum_users.user_id = user.id where forum_users.forum_slug = $1';
        let query = 'SELECT users.id, users.nickname, users.fullname, users.about, users.email FROM users JOIN forum_users ON forum_users.user_nickname = users.nickname WHERE forum_users.forum_slug = $1';


        const order = desc && !!desc ? 'desc' : 'asc';
        const sign = desc && !!desc ? '<' : '>';
        limit = limit ? limit : null;

        if (since) {
            query += ` AND nickname ${sign} '${since}' `
        }

        query += ` ORDER BY nickname ${order} LIMIT ${limit}`;

        console.log(query);
        try {
            return await this.dbCon.db.manyOrNone(query, forum);
        } catch (error) {
            console.log('ERROR: getUsersFromForum', error.message);
        }
    }

    async getCount() {
        try {
            const items = await this.dbCon.db.one(`SELECT count(id) FROM users`);
            return items ? Number(items.count) : 1;
        } catch (error) {
            console.log('ERROR: getCount user', error.message);
        }
    }

    async clearAll() {
        try {
            return await this.dbCon.db.none(`TRUNCATE users CASCADE`);
        } catch (error) {
            console.log('ERROR: clearAll user', error.message);
        }
    }
}

export const userRepository = new UserRepository();
