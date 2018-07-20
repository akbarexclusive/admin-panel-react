
// Refer https://github.com/skratchdot/react-bootstrap-daterangepicker

import React, { Component } from 'react';
import { Get } from 'common-js-util';

import GLOBAL from './../../../../Constants/global.constants';

import SelectBox from './../Select-Box/selectBoxForGenericForm.component';
import './listSelect.css';

export default class ListSelect extends Component {

    constructor(props) {
        super(props);

        this.state = {
            url: '',
            value: this.props.model || '',
            options: []
        }
    }

    loadOptions = async (column) => {

        let url = '';

        if ((column.reference_model) && column.reference_model.route_name) {
            var route = column.reference_model.route_name;
            url = route.split('api/admin/')[1]
        } else if (column.route) {
            var route = column.route;
            url = route.split('api/admin/')[1]
        }

        const result = await Get({ url: url });

        if (result.success) {
            const options = result.response;
            this.setState({ options });
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.column) {
            this.loadOptions(nextProps.column);
        }
    }

    render() {

        const { column } = this.props;

        const { url, value, options } = this.state;

        return (
            <div className="reference-input">
                <SelectBox
                    multi={this.props.multi}
                    options={options}
                    name={this.props.name}
                    onChange={this.props.onChange}
                    field={column.reference_model.display_column || column.display_column}
                    sortingType={column.sorting_type}
                    // async={url}
                    value={value} />
            </div>
        );
    }
}