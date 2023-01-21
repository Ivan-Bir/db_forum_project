import { BaseModel } from "../commonModels/baseModel.js";

export  class ResponseModel extends BaseModel {
    constructor(props) {
        super(props);

        const defaultResponse = {
            status: null,
            body: null,
            message: null,
        };

        this.props = Object.assign(defaultResponse, props);
    }
};
