sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/vendor/invoice/viewer/test/integration/pages/InvoicesList",
	"com/vendor/invoice/viewer/test/integration/pages/InvoicesObjectPage"
], function (JourneyRunner, InvoicesList, InvoicesObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/vendor/invoice/viewer') + '/test/flp.html#app-preview',
        pages: {
			onTheInvoicesList: InvoicesList,
			onTheInvoicesObjectPage: InvoicesObjectPage
        },
        async: true
    });

    return runner;
});

