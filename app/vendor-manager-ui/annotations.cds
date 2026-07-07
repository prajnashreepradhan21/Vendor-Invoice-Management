using VendorManagerService as service from '../../srv/vendor-manager-service';

annotate service.Invoices with @(
    UI: {
        SelectionFields: [
            vendor_ID,
            status,
            invoiceDate
        ],

        LineItem: [
            { Value: invoiceNumber, Label: 'Invoice Number' },
            { Value: vendor.vendorName, Label: 'Vendor' },
            { Value: invoiceDate, Label: 'Invoice Date' },
            { Value: dueDate, Label: 'Due Date' },
            { Value: amount, Label: 'Amount' },
            { Value: currency_code, Label: 'Currency' },
            { Value: status, Label: 'Status' }
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
                { Value: vendor_ID, Label: 'Vendor' },
                { Value: invoiceDate, Label: 'Invoice Date' },
                { Value: dueDate, Label: 'Due Date' },
                { Value: amount, Label: 'Amount' },
                { Value: currency_code, Label: 'Currency' },
                { Value: status, Label: 'Status' },
                { Value: submittedBy, Label: 'Submitted By' },
                { Value: submittedAt, Label: 'Submitted At' }
            ]
        },

        Identification: [
            {
                $Type: 'UI.DataFieldForAction',
                Action: 'VendorManagerService.submitForApproval',
                Label: 'Submit for Approval',
                Inline: true
            }
        ]
    },
    Search.searchable: true
) {
    vendor_ID @(
        Common.ValueList: {
            CollectionPath: 'Vendors',
            Parameters: [
                { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: vendor_ID, ValueListProperty: 'ID' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'vendorName' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'email' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'phone' },
                { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'address' }
            ]
        },
        Common.Text: vendor.vendorName,
        Common.Text.@UI.TextArrangement: #TextOnly,
        Common.Label: 'Vendor'
    );

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
) {
    totalAmount @Common.FieldControl: #ReadOnly;
};

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