namespace vendorinvoice.db;

using { cuid, managed } from '@sap/cds/common';

@odata.draft.enabled
entity VendorApprovalRequest : cuid, managed {

    @mandatory
    vendorName          : String(100);

    @mandatory
    email               : String(100);

    phone               : String(20);

    @mandatory
    country             : String(50);

    currency            : String(3);

    taxID               : String(50);

    externalID          : String(50);

    requestedBy         : String(100);

    workflowInstanceId  : String(100);

    status              : String(20) default 'PENDING';

}