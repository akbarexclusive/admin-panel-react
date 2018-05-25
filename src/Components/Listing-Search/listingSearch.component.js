import React, { Component } from 'react';
import { Collapse, Button, CardBody, Card } from 'reactstrap';

import SelectBox from './../Forms/Components/Select-Box/selectBox';

import { SubscribeToEvent, UnsubscribeEvent } from './../../Utils/stateManager.utils';

import './listingSearch.component.css'
import GLOBAL from './../../Constants/global.constants';

import { SelectFromOptions, IsUndefined } from './../../Utils/common.utils';
import { Location } from './../../Utils/location.utils';
import { GetTime, TimeOperation } from './../../Utils/time.utils';
import { Get } from './../../Utils/http.utils';
import { BuildUrlForGetCall } from './../../Utils/common.utils';
import DatePicker from './../Forms/Components/Date-Picker/datePicker';


let activeColumn = {};

export default class ListingSearch extends React.Component {
    urlParams = Location.search();
    constructor(props) {
        super(props);
        this.state = {
            selectedColumn: {},
            getObj: {},
            query: ''
        };
    }

    componentDidMount() {
        this.initialize();
    }

    componentWillReceiveProps() {
        this.initialize();
    }

    // Initialize the controller
    initialize() {
        const { dictionary, searchQuery } = this.props;

        if (searchQuery) {
            const values = searchQuery.split(' ');
            console.log(values);
            const regex = /["%]/g;
            values[2] = values[2].replace(regex, '');
            const selectedColumn = SelectFromOptions(dictionary, values[0], 'column_name');

            let query;
            if (!(selectedColumn && selectedColumn.referenced_model)) {
                query = values[2];
            }
            this.setState({ selectedColumn, query });
        }

    }

    /**
     * Invoked when Filter is selected
     * @param  {string} filter
     * @param  {} {parentIndex
     * @param  {} index
     * @param  {} dontPropagateFocus}
     */
    filterChange(select) {
        let valueColumnType = "input";
        this.setState({
            selectedColumn: select
        })

        activeColumn = select;
    }

    /**
    * Fetches async data from server and used to select reference type data
    * @param  {string} val
    * @param  {} index
    * @param  {} queryField
    */
    getInputRecord = async ({ input: val, select, queryFieldName } = {}) => {

        if (val) {
            const { filterArr } = this.state;
            const displayName = activeColumn.referenced_model.display_column;
            const queryField = queryFieldName ? queryFieldName : displayName;
            let url = activeColumn.referenced_model.route_name;
            const options = {
                query: queryField + ' like "%' + val + '%"'
                // query: queryField + ' like %22%25' + val + '%25%22'
            };

            if (activeColumn.sorting_type) {
                options.query += " and " + activeColumn.column.sorting_type;
            }

            url = BuildUrlForGetCall(url, options);
            const result = await Get({ url, urlPrefix: GLOBAL.ROUTE_URL });


            if (queryFieldName) {
                return result.response;
            }
            const response = result.response.map((option) => {
                return { ...option, ...{ label: option[displayName], value: option['id'] } }
            });
            return { options: response };
        }
    }

    convertToInputField = (data) => {
        let query = '';
        this.setState({
            getObj: data
        })

        switch (activeColumn.column_type) {
            case 116: case 117:
                query += activeColumn.column_name + ' = ' + data.data.id;
                break;

            default:
                query += activeColumn.column_name + ' = ' + data.data;
                break;
        }

        const urlParams = this.urlParams;
        urlParams.search = query;
        Location.search(urlParams);
    };

    callFunction = () => {
        let query = '';
        const urlParams = this.urlParams;

        const paramProps = {
            history: this.props.history, match: this.props.match
        };

        query += activeColumn.column_name + ' like "%' + this.state.inputValue + '%"';
        urlParams.search = query;
        Location.search(urlParams, { props: paramProps });

    }

    handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            this.callFunction();
            return;
        }
        this.setState({ inputValue: this.state.inputValue + e.key })
    }


    render() {
        const { props } = this;
        const { dictionary, history, match } = this.props;
        const { selectedColumn = {}, query = '' } = this.state;
        const { referenced_model = {} } = selectedColumn;
        const { getObj } = this.state;

        console.log(selectedColumn);
        return (
            <div className="listing-search-container">
                {
                    <div className="listing-search-tool">
                        <div className="listing-select-tool">
                            <SelectBox onChange={(data) => {
                                this.filterChange(data)
                            }}
                                value={selectedColumn} field='display_name' options={dictionary} placeholder='Column' />
                        </div>
                        <div className="listing-input-tool">
                            {referenced_model ? (
                                <SelectBox
                                    onChange={(data) => this.convertToInputField({ data })}
                                    value={getObj.data}
                                    field={referenced_model.display_column}
                                    place-holder="Search"
                                    getOptions={(input) => this.getInputRecord({ input })} />
                            ) :
                                (
                                    <input type="text"
                                        className="input-select form-control"
                                        placeholder={`Search ${selectedColumn.display_name}`}
                                        value={query}
                                        onChange={event => { this.setState({ query: event.target.value }) }}
                                        onKeyPress={this.handleKeyPress}
                                    //value={value}
                                    // { data: data.target.value, event: event }
                                    //onChange={(data) => this.convertToInputField({ data: data.target.value })}
                                    //onKeyPress={(data) => this.convertToInputField({ data: data.target.value })}
                                    //value={}
                                    />
                                )
                            }
                        </div>
                    </div>
                }
            </div>
        );
    }
}
