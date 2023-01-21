export  class BaseModel {
    constructor(props) {
        this.props = props;
    }

    update(newProps) {
        this.props = Object.assign(this.props, newProps);
    }
};
