import { BaseModel } from '../commonModels/baseModel.js';

export  class UserModel extends BaseModel {
    constructor(props) {
        super(props);

        const defaultUser = {
            email: null,
            nickname: null,
            fullname: null,
            about: null
        };

        this.props = Object.assign(defaultUser, props);
    }
};
