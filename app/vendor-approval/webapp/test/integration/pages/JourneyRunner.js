sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"vendorapproval/test/integration/pages/VendorApprovalRequestsObjectPage.gen"
], function (JourneyRunner, VendorApprovalRequestsObjectPageGenerated) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('vendorapproval') + '/test/flp.html#app-preview',
        pages: {
			onTheVendorApprovalRequestsObjectPageGenerated: VendorApprovalRequestsObjectPageGenerated
        },
        async: true
    });

    return runner;
});

