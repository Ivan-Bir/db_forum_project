import { BaseModel } from "../commonModels/baseModel.js";

export  class ThreadModel extends BaseModel {
    constructor(props) {
        super(props);

        const defaultThread = {
            slug: null,
            user_nickname: null,
            forum_slug: null,
            title: null,
            message: null,
            created: null,
            votes: null,
        };

        this.props = Object.assign(defaultThread, props);
    }
};
