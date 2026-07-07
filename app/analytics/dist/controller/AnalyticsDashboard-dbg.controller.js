sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem"
], function (
    Controller,
    JSONModel,
    FlattenedDataset,
    FeedItem
) {
    "use strict";

    return Controller.extend("com.vendor.invoice.analytics.controller.AnalyticsDashboard", {

        onInit: async function () {

            this.getView().setModel(new JSONModel(), "view");
            this.getView().setModel(new JSONModel(), "status");
            this.getView().setModel(new JSONModel(), "trend");
            this.getView().setModel(new JSONModel(), "vendors");

            await this.loadKPIs();
            await this.loadStatusBreakdown();
            await this.loadInvoiceTrend();
            await this.loadTopVendors();
        },

        loadKPIs: async function () {

            try {

                const oModel = this.getOwnerComponent().getModel();

                const oBinding = oModel.bindContext("/getKPIs(...)");

                await oBinding.execute();

                const oData = oBinding.getBoundContext().getObject();

                this.getView().getModel("view").setData(oData);

            } catch (err) {

                console.error("Error loading KPIs", err);

            }

        },

        loadStatusBreakdown: async function () {

            try {

                const oModel = this.getOwnerComponent().getModel();

                const oBinding = oModel.bindContext("/getStatusBreakdown(...)");

                await oBinding.execute();

                const oData = oBinding.getBoundContext().getObject();

                this.getView().getModel("status").setData({
                    results: oData.value || []
                });

                this._buildStatusChart();

            } catch (err) {

                console.error("Error loading Status Breakdown", err);

            }

        },

        loadInvoiceTrend: async function () {

            try {

                const oModel = this.getOwnerComponent().getModel();

                const oBinding = oModel.bindContext("/getInvoiceTrend(...)");

                await oBinding.execute();

                const oData = oBinding.getBoundContext().getObject();

                this.getView().getModel("trend").setData({
                    results: oData.value || []
                });

            } catch (err) {

                console.error("Error loading Invoice Trend", err);

            }

        },

        loadTopVendors: async function () {

            try {

                const oModel = this.getOwnerComponent().getModel();

                const oBinding = oModel.bindContext("/getTopVendors(...)");

                await oBinding.execute();

                const oData = oBinding.getBoundContext().getObject();

                this.getView().getModel("vendors").setData({
                    results: oData.value || []
                });

            } catch (err) {

                console.error("Error loading Top Vendors", err);

            }

        },
    buildStatusChart: function () {

    var oChart = this.byId("statusChart");

    oChart.setDataset(new FlattenedDataset({

        dimensions: [{
            name: "Status",
            value: "{status>status}"
        }],

        measures: [{
            name: "Count",
            value: "{status>count}"
        }],

        data: {
            path: "status>/results"
        }

    }));

    oChart.removeAllFeeds();

    oChart.addFeed(new FeedItem({
        uid: "size",
        type: "Measure",
        values: ["Count"]
    }));

    oChart.addFeed(new FeedItem({
        uid: "color",
        type: "Dimension",
        values: ["Status"]
    }));

    oChart.setModel(this.getView().getModel("status"), "status");
    }
});
});