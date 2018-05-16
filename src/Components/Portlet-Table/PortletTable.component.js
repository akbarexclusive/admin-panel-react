import React, { Component } from 'react';
import './PortletTable.css';

import {
    Table, Card, CardImg, CardText, CardBody,
    CardTitle, CardSubtitle, Dropdown, DropdownToggle, DropdownMenu, DropdownItem
} from 'reactstrap';

import CustomAction from './../Custom-Action/CustomAction.component';

export default class PortletTable extends Component {

    constructor(props) {
        super(props);

        this.state = {
            finalColumns: this.props.finalColumns,
            listing: this.props.listing,
            genericData: this.props.genericData,
            sortKey: '',
            reverse: false
        };
        this.onSort = this.onSort.bind(this)
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            finalColumns: nextProps.finalColumns,
            listing: nextProps.listing,
            genericData: nextProps.genericData
        });
    }

    componentDidMount() {
        setTimeout(() => {
            this.adjustWidth();
        }, 300)
    }


    // According to action width 
    // width of table is assigned
    adjustWidth = () => {
        const actionColumnEle = document.getElementsByClassName('action-column')[0];
        if (actionColumnEle) {
            var actionColumnWidth = actionColumnEle.clientWidth;
            var table = document.getElementsByClassName('table')[0];
            var tableWidth = table.clientWidth;

            var percent = (100 - (actionColumnWidth / tableWidth) * 100);

            table.setAttribute('style', 'width:calc(' + percent + '% - 2px )');
        }
    }

    onSort(event, sortKey) {
        const listing = this.state.listing;

        function generateSortFn(prop, reverse) {
            return function (a, b) {
                if (eval('a.' + prop) < eval('b.' + prop)) return reverse ? 1 : -1;
                if (eval('a.' + prop) > eval('b.' + prop)) return reverse ? -1 : 1;
                return 0;
            };
        }

        let reverse = this.state.reverse;

        if (this.state.sortKey == sortKey) {

            reverse = !reverse;
            listing.sort(generateSortFn(sortKey, reverse));

        } else {
            reverse = false;
            listing.sort(generateSortFn(sortKey, reverse));
        }

        this.setState({ listing, sortKey, reverse })
    }

    render() {
        const { genericData, finalColumns, listing, history, callback, rowTemplate } = this.state;
        return (
            <Table striped className="sortable">
                <thead>
                    <tr>
                        <th>
                        </th>
                        {
                            finalColumns.map((selectedColumn, key) => {
                                return (
                                    <th className="column-header" key={key} onClick={e => this.onSort(e, selectedColumn.column_type != 118 ? (selectedColumn.path) : (selectedColumn.headerName))}>
                                        {/* Column Wrapper */}
                                        <div className="column-wrapper">
                                            {/* Column Title */}
                                            <div className="column-title printable">
                                                {selectedColumn.display_name}
                                                <i className={`fas ${(this.state.sortKey === (selectedColumn.column_type != 118 ? (selectedColumn.path) : (selectedColumn.column_name))) ? (this.state.reverse ? 'fa-chevron-up' : 'fa-chevron-down') : ''}`} />
                                            </div>
                                            {/* Column Title Ends */}

                                            {/* Filter Column */}
                                            {
                                                selectedColumn.path.split('.').length < 3 &&
                                                <div className="filter-column">
                                                    <a ng-click="portlet.preventDefault($event);portlet.filterColumn(select-edColumn)">
                                                        <i className="fas fa-filter"></i>
                                                    </a>
                                                </div>
                                            }
                                            {/* Filter Ends */}
                                            {/* DB Level */}

                                            {
                                                (selectedColumn.path.split('.').length == 1) && (selectedColumn.column_type != 118) &&
                                                (
                                                    <div className="db-level-sort">

                                                        {/* <span>
                                                        <a className="dropdown-link" id="simple-dropdown">
                                                            <i className="fa fa-sort-amount-asc"></i>
                                                        </a>
                                                    </span> */}
                                                    </div>
                                                )
                                            }
                                            {/* <div class="db-level-sort" ng-if="selectedColumn.path.split('.').length==1&&selectedColumn.column_type!=118">
                                            <span uib-dropdown on-toggle="toggled(open)">
                                                <a class="dropdown-link" id="simple-dropdown" uib-dropdown-toggle>
                                                    <i class="fa fa-sort-amount-asc"></i>
                                                </a>
                                                <ul class="dropdown-menu" uib-dropdown-menu aria-labelledby="simple-dropdown">
                                                    <li ng-repeat="sort in portlet.sortTypes" ng-click="portlet.sortOnDB(sort, selectedColumn.path)">
                                                        <a>
                                                            <i class="fa {{sort.icon}}"></i>
                                                            {{ sort.caption }}
                                                        </a>
                                                    </li>
                                                </ul>
                                            </span>
                                        </div> */}
                                            {/* DB Level Ends */}
                                        </div>
                                    </th>
                                )
                            })
                        }
                        <th className="action-header">
                            <span className="fa fa-cog fa-lg"></span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {

                        listing.map((listingRow, rowKey) => {
                            return (
                                <tr className="table-row" key={rowKey}>

                                    <td className="row-key">
                                        {rowKey + 1}
                                    </td>

                                    {
                                        finalColumns.map((selectedColumn, key) => (
                                            <td key={key}>
                                                {
                                                    rowTemplate ?
                                                        rowTemplate({ listingRow, selectedColumn }) :
                                                        eval('listingRow.' + selectedColumn.path)
                                                }
                                            </td>
                                        ))
                                    }
                                    <td className="custom-action action-column">
                                        <CustomAction history={history} genericData={genericData} actions={genericData.nextActions} listingRow={listingRow} placement={167} callback={callback} />
                                    </td>
                                </tr>
                            )
                        })
                    }
                </tbody>
            </Table>
        );
    }
}
