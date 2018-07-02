import React, { Component } from 'react';

import './genericListing.css';

import {
    Card, CardBody, Button
} from 'reactstrap';

import DynamicFilter from './../../Components/Dynamic-Filter/dynamicFilter.component';
import ConfigureDynamicFilter from './../../Components/Dynamic-Filter/configureFilter.component';
import ListingPagination from './../../Components/Listing-Pagination/ListingPagination';
import TableSettings from './../../Components/Table-Settings/TableSettings.component';
import PortletTable from './../../Components/Portlet-Table/PortletTable.component';
import CustomAction from './../../Components/Custom-Action/CustomAction.component';
import PredefinedFilter from './../../Components/Dropdown-Filter/filter.component';
import ListingSearch from './../../Components/Listing-Search/listingSearch.component';

import { HotKeys } from 'react-hotkeys';

import { CopyToClipBoard } from './../../Utils/common.utils';
import ToastNotifications from './../../Utils/toast.utils';
import { Get } from './../../Utils/http.utils';
import { BuildUrlForGetCall } from './../../Utils/common.utils';
import { GetDefaultOptions } from './../../Utils/genericListing.utils';
import { GetUrlParams, Location } from './../../Utils/location.utils';
import { GetMenuDetail, ConvertMenuDetailForGenericPage, CreateFinalColumns } from './../../Utils/generic.utils';
import { GetListingRecord } from './../../Utils/genericListing.utils';
import { SubscribeToEvent, UnsubscribeEvent, StoreEvent } from './../../Utils/stateManager.utils';

export default class GenericListing extends Component {
    filterContent = {};
    urlParams = Location.search();

    constructor(props) {
        super(props);
        this.state = {
            ...GetUrlParams(this.props), // params, queryString
            menuDetail: {},
            localSearch: {},
            genericData: {},
            filterContent: null,
            isCollapsed: true,
            state: this.props.source || 'menu'
        };
        SubscribeToEvent({ eventName: 'loggedUser', callback: this.userDataArrived });
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const newProps = GetUrlParams(nextProps);
        this.state.params = newProps.params;
        this.state.queryString = newProps.queryString;
        if (this.state.menuDetail.url) {
            this.getListingData();
        }
    }

    componentWillUnmount() {
        this.state.isCollapsed = false;
        UnsubscribeEvent({ eventName: 'loggedUser', callback: this.userDataArrived });
    }

    userDataArrived = (user) => {
        const { menuDetail } = this.props;
        this.state.currentUser = user;

        if (menuDetail) {
            this.state.menuDetail = menuDetail;
            // this.setState({ menuDetail });
            this.getListingData();
        } else {
            this.getMenuData();
        }
    }

    getMenuData = async () => {
        const { queryString } = this.state;
        const { menuId, limit, page } = this.props;
        const result = await GetMenuDetail(menuId);
        if (result.success) {

            const { response = {} } = result;
            const menuDetail = ConvertMenuDetailForGenericPage(response || {});
            // if (typeof response.controller_path == 'string' && response.controller_path.includes('genericListingController.js') != -1) {
            this.state.menuDetail = menuDetail;
            console.log(menuDetail);
            this.getListingData();
            StoreEvent({ eventName: 'showMenuName', data: { menuName: this.state.menuDetail.pageName } });
            // }
        }
    }

    getListingData = () => {
        const { menuDetail, genericData, queryString, currentUser } = this.state;
        GetListingRecord({ configuration: menuDetail, callback: this.dataFetched, data: genericData, queryString, currentUser });
    }

    dataFetched = ({ genericData, filterContent }) => {
        this.setState({ genericData, filterContent });
    }

    openAggregationResult = async (operator, caption, data) => {
        let options = GetDefaultOptions();
        options.aggregation_column = data.selectedColumn.name;
        options.aggregation_operator = operator;

        const url = BuildUrlForGetCall(data.menuDetail.url, options);

        const result = await Get({ url });

        if (result.success) {
            ToastNotifications.success(caption + result.response);
        }
    }

    filterTable = (data, method) => {
        const paramProps = {
            history: data.history, match: data.match
        };

        let query = '';
        if (data.selectedColumn.path.split(".").length == 1) { // for columns which is child of table itself
            if (this.urlParams.query) { // if previous query present then it will executed
                let a = {};
                let f = 0;
                a = this.urlParams.query.split(" AND ");
                for (let i = 0; i < a.length; i++) { // for checking overlapping query
                    let b = {};
                    let newquery;
                    b = a[i].split(" LIKE ");
                    if (newquery == b[0]) {
                        f = 1;
                    }
                }
                if (f == 0) { // if not overlappin

                    query = this.urlParams.query + ' AND ' + data.selectedColumn.name + method[0] + "'" + data.listingRow[data.selectedColumn.name] + "'";

                    this.urlParams.query = query;
                    Location.search(this.urlParams, { props: paramProps });
                } else { // if overlappin

                    query = this.urlParams.query;

                    this.urlParams.query = query;
                    Location.search(this.urlParams, { props: paramProps });
                }
            } else { // if previous query not present then it will executed

                query = data.selectedColumn.name + method[0] + "'" + data.listingRow[data.selectedColumn.name] + "'";

                this.urlParams.query = query;
                Location.search(this.urlParams, { props: paramProps });
            }
        } else if (data.selectedColumn.path.split(".").length == 2) { // This will executed when showmatching clicked second time
            let regex = /.([^.]*)$/; // filters out anything before first '.'
            let path = data.selectedColumn.path.replace(regex, "");
            if (this.urlParams.query) { // if previous query present then it will executed
                let newquery = data.selectedColumn["parent"] + './id';
                let a = {};
                let f = 0;
                a = this.urlParams.query.split(" AND ");
                for (let i = 0; i < a.length; i++) { // for checking overlapping query
                    let b = {};
                    b = a[i].split(" = ");
                    if (newquery == b[0]) {
                        f = 1;
                    }
                }
                if (f == 0) { // if not overlapping
                    query = this.urlParams.query + ' AND ' + data.selectedColumn["parent"] + '.id' + method[1] + "'" + data.listingRow[data.starter + '.id'] + "'";
                    Location.search({
                        query: query
                    });
                } else { // if overlapping
                    query = this.urlParams.query;
                    Location.search({
                        query: query
                    });
                }
            } else { // if previous query not present then it will executed

                query = data.selectedColumn["parent"] + '.id' + method[1] + "'" + data.listingRow[data.starter + '.id'] + "'";

                this.urlParams.query = query;

                Location.search(this.urlParams, { props: paramProps });
            }
        }
    }

    filterColumn = (column) => {
        let selected;
        if (column.path.split(".").length == 1) { // for columns which is child of table itself
            selected = column.name;
        } else if (column.path.split(".").length == 2) { // for reference columns (for e.g. Created by table in with any menu)
            selected = column.parentColumn;
        }

        if (typeof this.toggleAdvancedFilter == 'function') {
            this.toggleAdvancedFilter({ single: selected });
        }
    };

    keyMap = {
        moveUp: 'shift+r',
    }

    handlers = {
        'moveUp': (event) => this.getListingData()
    }

    toggleAdvancedFilter = (payload = {}) => {
        const { isCollapsed } = this.state;
        this.setState({ isCollapsed: !isCollapsed });
        StoreEvent({ eventName: 'ToggleAdvancedFilter', data: { isCollapsed: !isCollapsed, ...payload } });
    }

    predefinedFiltersUpdated = (latyouts) => {
        const { genericData } = this.state;
        genericData.layouts = latyouts;
        // this.setState({ genericData });
        this.state.genericData = genericData;
    }

    layoutChanges = (layout) => {
        let { genericData } = this.state;
        genericData.layout = layout;
        if (layout && layout.column_definition) {
            genericData.finalColumns = CreateFinalColumns(genericData.columns, layout.column_definition, genericData.relationship);
            this.setState({ genericData });
        }
    }

    refreshPage() {
        this.getListingData();
    }

    /**
     * Maintain localSearch for locally searching on type 
     */
    filterLocally = (column, value) => {
        this.setState({ localSearch: { field: column ? column.name : '', value: value ? value : null } });
    }

    render() {
        const { localSearch, genericData = {}, pagesOnDisplay, menuDetail = {}, filterContent, currentUser } = this.state;
        const { listing = [], finalColumns = [] } = genericData;
        const { starter } = genericData;

        let filteredResults = [];

        if (localSearch.value) {
            filteredResults = listing.filter(entry => entry[starter + '.' + localSearch.field] && (entry[starter + '.' + localSearch.field].toString().toLowerCase().indexOf(localSearch.value) != -1));
        }

        // const listingData = 
        const { history, match, parentData = {} } = this.props;
        return (
            <HotKeys keyMap={this.keyMap} handlers={this.handlers}>
                <div className="generic-listing-container">
                    <div className="page-bar">
                        <div className="search-bar">
                            <div className="generic-listing-search">
                                {
                                    filterContent && filterContent.dictionary &&
                                    <ListingSearch localSearch={localSearch} onEdit={this.filterLocally} searchDetail={{ name: genericData.model.display_column }} searchQuery={this.urlParams.search} dictionary={filterContent.dictionary} />
                                }
                            </div>
                            <div className="search-wrapper">
                                {
                                    filterContent && filterContent.dictionary &&
                                    <DynamicFilter
                                        toggleAdvancedFilter={this.toggleAdvancedFilter}
                                        menuUpdatedCallback={this.predefinedFiltersUpdated}
                                        selectedColumns={genericData.layout ? genericData.layout.column_definition : null}
                                        menuId={menuDetail.menuId}
                                        currentUser={currentUser}
                                        dictionary={filterContent.dictionary}
                                        layouts={menuDetail.layouts}
                                        history={history}
                                        match={match}
                                    />
                                }
                            </div>
                        </div>
                        <div className="header-actions">
                            <CustomAction position="header" parentData={parentData} menuDetail={menuDetail} history={history} genericData={genericData} actions={genericData.nextActions} placement={'as_header'} />
                            {
                                genericData.columns ?
                                    <TableSettings
                                        source='menu'
                                        onSubmit={this.layoutChanges}
                                        listName={genericData.listName}
                                        layout={genericData.layout}
                                        columns={genericData.columns}
                                        menuId={menuDetail.menuId}
                                        userId={currentUser.id}
                                    />
                                    :
                                    null
                            }
                            <Button color="primary" size="sm" onClick={() => { this.refreshPage() }}>
                                <i className="fa fa-refresh"></i>
                            </Button>
                            {
                                menuDetail && genericData.userFilter && genericData.userFilter.length > 0 ?
                                    <PredefinedFilter onFilterUpdate={this.predefinedFiltersUpdated} layouts={menuDetail.layouts} history={history} match={match} />
                                    :
                                    null
                            }
                        </div>
                    </div>
                    <div>
                        {
                            filterContent &&
                            <ConfigureDynamicFilter
                                history={history}
                                match={match}
                                filters={genericData.userFilter}
                                content={filterContent}
                            />
                        }
                    </div>

                    {
                        (finalColumns && finalColumns.length) ?
                            <Card>
                                <CardBody className="table-wrapper">

                                    {/* Portlet Table */}
                                    <PortletTable tableType="listing"
                                        rowOptions={this.rowOptions}
                                        parentData={parentData}
                                        // toggleAdvancedFilter={this.toggleAdvancedFilter} 
                                        history={history} match={match}
                                        genericData={genericData}
                                        finalColumns={finalColumns}
                                        listing={localSearch.value ? filteredResults : listing}
                                        callback={this.getListingData}
                                        menuDetail={menuDetail}
                                    />
                                    {/* Portlet Table Ends */}

                                </CardBody>
                            </Card> : null
                    }

                    {
                        (listing && listing.length) ?
                            <ListingPagination history={history} match={match} current_page={genericData.currentPage} limit={genericData.limit} statsData={genericData.stats} /> : null
                    }
                    {/* Listing Pagination Ends */}
                </div>
            </HotKeys>
        );
    }


    // Preparing option for right click
    rowOptions = [
        {
            id: 0,
            name: "Copy Row Id",
            icon: 'fa-copy',
            subMenu: false,
            onClick: (data) => {
                let id = data.listingRow[data.starter + '.id'];
                CopyToClipBoard(id);
                ToastNotifications.success("Id - " + id + " has been copied");
            },
            disabled: false
        }, { subMenu: null }, {
            id: 1,
            name: "Show Matching",
            icon: 'fa-retweet',
            subMenu: false,
            onClick: (data) => {
                this.filterTable(data, [" LIKE ", " = "]);
                return data.selectedColumn.path.split(".").length < 3;
            },
            disabled: false
        }, {
            id: 2,
            name: "Filter Out",
            icon: 'fa-columns',
            subMenu: false,
            onClick: (data) => {
                this.filterTable(data, [" NOT LIKE ", " != "]);
                return data.selectedColumn.path.split(".").length < 3;
            },
            disabled: false
        }, {
            id: 3,
            name: "Filter More",
            icon: 'fa-filter',
            subMenu: false,
            onClick: (data) => {
                this.filterColumn(data.selectedColumn);
                return data.selectedColumn.path.split(".").length < 3;
            },
            disabled: false
        }, {
            id: 4,
            name: "Aggregation",
            icon: 'fa-chart-line',
            subMenu: true,
            onClick: (data, operator) => {
                console.log(data, operator);
                this.openAggregationResult(operator.name.toLowerCase(), operator.name + ' of ' + data.selectedColumn.display_name + ' equals : ', data)
            }, disabled: (data) => {
                return (data.selectedColumn.path.split('.').length != 1)
            }
        }, { subMenu: null },
        {
            id: 4,
            name: "Redirect Menu Detail",
            icon: 'fa-deaf',
            subMenu: false,
            onClick: (data) => {
                const { history, match } = this.props;

                let pageUrl = "/menuDef/" + data.menuDetail.menuId

                history.push(`${pageUrl}`);
            },
            disabled: false
        }, {
            id: 4,
            name: "Redirect Model Detail",
            icon: 'fa-info-circle',
            subMenu: false,
            onClick: (data) => {
                const { history, match } = this.props;

                let pageUrl = "/modelDetails/" + data.menuDetail.model.id

                history.push(`${pageUrl}`);
            },
            disabled: false
        }, {
            id: 0,
            name: "Preferences Settings",
            icon: 'fa-gift',
            subMenu: false,
            disabled: this.preferenceObj ? true : false,
            onClick: (data) => {
                const { genericData = {}, menuDetail } = this.state;
                const preferenceObj = { // used for editing preferences
                    name: menuDetail.pageName, // preference name to be shown on modal
                    role: true
                }
                if (genericData.preDefinedmethods && genericData.preDefinedmethods.preferenceSetting) {
                    genericData.preDefinedmethods.preferenceSetting(menuDetail.preference, preferenceObj);
                }
            }
        }
    ];
}
