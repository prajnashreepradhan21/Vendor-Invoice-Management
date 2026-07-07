using ApproverService as service from '../../srv/approver-service';

annotate service.Invoices with @(
    UI: {
        SelectionFields: [
            vendor_ID,
            invoiceDate,
            amount
        ],

        LineItem: [
            { Value: invoiceNumber, Label: 'Invoice Number' },
            { Value: vendor.vendorName, Label: 'Vendor' },
            { Value: invoiceDate, Label: 'Invoice Date' },
            { Value: dueDate, Label: 'Due Date' },
            { Value: amount, Label: 'Amount' },
            { Value: currency_code, Label: 'Currency' },
            {
                Value: status,
                Label: 'Status',
                Criticality: statusCriticality,
                CriticalityRepresentation: #WithIcon
            }
        ],

        PresentationVariant: {
            SortOrder: [{ Property: invoiceDate, Descending: true }],
            Visualizations: ['@UI.LineItem']
        },

        HeaderInfo: {
            TypeName: 'Invoice',
            TypeNamePlural: 'Invoices',
            Title: { Value: invoiceNumber },
            Description: { Value: vendor.vendorName }
        },

        HeaderFacets: [
            {
                $Type: 'UI.ReferenceFacet',
                Target: '@UI.FieldGroup#StatusInfo',
                Label: 'Status'
            }
        ],

        FieldGroup#StatusInfo: {
            Data: [
                { Value: status, Criticality: statusCriticality, CriticalityRepresentation: #WithIcon },
                { Value: submittedBy, Label: 'Submitted By' },
                { Value: submittedAt, Label: 'Submitted At' }
            ]
        },

        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'GeneralInfo',
                Label: 'General Information',
                Target: '@UI.FieldGroup#GeneralInfo'
            },
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'LineItems',
                Label: 'Line Items',
                Target: 'items/@UI.LineItem'
            },
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'Attachments',
                Label: 'Attachments',
                Target: 'attachments/@UI.LineItem'
            },
            {
                $Type: 'UI.ReferenceFacet',
                ID: 'ApprovalHistory',
                Label: 'Approval History',
                Target: 'approvalHistory/@UI.LineItem'
            }
        ],

        FieldGroup#GeneralInfo: {
            Data: [
                { Value: invoiceNumber, Label: 'Invoice Number' },
                { Value: vendor.vendorName, Label: 'Vendor' },
                { Value: invoiceDate, Label: 'Invoice Date' },
                { Value: dueDate, Label: 'Due Date' },
                { Value: amount, Label: 'Amount' },
                { Value: currency_code, Label: 'Currency' }
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ApproverService.approveInvoice',
                Label: 'Approve',
                Inline: true
            },
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'ApproverService.rejectInvoice',
                Label: 'Reject',
                Inline: true
            }
        ]
    },
    Search.searchable: true
) {
    invoiceNumber @Search.defaultSearchElement: true;
    status @Common.FieldControl: #ReadOnly;
};

annotate service.InvoiceItems with @(
    UI.LineItem: [
        { Value: lineNumber, Label: 'Line No' },
        { Value: description, Label: 'Description' },
        { Value: quantity, Label: 'Quantity' },
        { Value: unitPrice, Label: 'Unit Price' },
        { Value: totalAmount, Label: 'Total Amount' }
    ]
);

annotate service.Attachments with @(
    UI.LineItem: [
        { Value: fileName, Label: 'File Name' },
        { Value: fileSize, Label: 'File Size' },
        { Value: mediaType, Label: 'File Type' },
        { Value: uploadedBy, Label: 'Uploaded By' },
        { Value: uploadedAt, Label: 'Uploaded At' }
    ]
) {
    content @Core.MediaType: mediaType;
    content @Core.ContentDisposition.Filename: fileName;
};

annotate service.ApprovalHistory with @(
    UI: {
        LineItem: [
            { Value: action, Label: 'Action' },
            { Value: actorName, Label: 'Actor' },
            { Value: actionAt, Label: 'Timestamp' },
            { Value: comments, Label: 'Comments' }
        ],
        PresentationVariant: {
            SortOrder: [{ Property: actionAt, Descending: false }]
        }
    }
);