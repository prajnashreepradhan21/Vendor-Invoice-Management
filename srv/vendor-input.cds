using { vendorinvoice.db as db } from '../db/vendor-input-schema';

@requires: 'any'
service WorkflowService @(path:'/workflow') {

    @odata.draft.enabled
    entity VendorApprovalRequests
        as projection on db.VendorApprovalRequest;

}