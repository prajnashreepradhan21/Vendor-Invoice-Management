using WorkflowService as service from '../../srv/vendor-input';
annotate service.VendorApprovalRequests with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'vendorName',
                Value : vendorName,
            },
            {
                $Type : 'UI.DataField',
                Label : 'email',
                Value : email,
            },
            {
                $Type : 'UI.DataField',
                Label : 'phone',
                Value : phone,
            },
            {
                $Type : 'UI.DataField',
                Label : 'country',
                Value : country,
            },
            {
                $Type : 'UI.DataField',
                Label : 'currency',
                Value : currency,
            },
            {
                $Type : 'UI.DataField',
                Label : 'taxID',
                Value : taxID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'externalID',
                Value : externalID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'requestedBy',
                Value : requestedBy,
            },
            {
                $Type : 'UI.DataField',
                Label : 'workflowInstanceId',
                Value : workflowInstanceId,
            },
            {
                $Type : 'UI.DataField',
                Label : 'status',
                Value : status,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
);

