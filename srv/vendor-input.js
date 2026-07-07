const cds = require('@sap/cds');
const axios = require('axios');
const { UPDATE } = cds.ql;

const TOKEN_URL =
'https://f709e662trial.authentication.us10.hana.ondemand.com/oauth/token';

const CLIENT_ID =
'sb-a68b4273-c714-43b9-9dff-2641903d08cc!b666134|xsuaa!b49390';

const CLIENT_SECRET =
'480b9ab5-3268-40cd-bcf4-ff37330591dd$gdHnjS7ehCrYrl3rsZCSmrpZXuWdxSlAivZL0lo9iM8=';

const WORKFLOW_URL =
'https://spa-api-gateway-bpi-us-prod.cfapps.us10.hana.ondemand.com/workflow/rest/v1/workflow-instances';

const DEFINITION_ID =
  "us10.f709e662trial.vendorapprovalprocess.vendorApprovalProcess";

module.exports = cds.service.impl(async function () {

    const { VendorApprovalRequests } = this.entities;
    const db = cds.entities('vendorinvoice.db');
    const { VendorApprovalRequest: DBVendorApprovalRequest } = db;

    this.after('CREATE', VendorApprovalRequests, async (data) => {

        try {

            const token = await axios.post(
                TOKEN_URL,
                'grant_type=client_credentials',
                {
                    auth: {
                        username: CLIENT_ID,
                        password: CLIENT_SECRET
                    },
                    headers: {
                        'Content-Type':
                        'application/x-www-form-urlencoded'
                    }
                }
            );

            const accessToken = token.data.access_token;

            const payload = {

                definitionId: DEFINITION_ID,

                context: {

                    vendorID: data.ID,

                    vendorName: data.vendorName,

                    email: data.email,

                    phone: data.phone,

                    requestedBy: data.requestedBy || "Prajnashree"

                }

            };

            const response = await axios.post(

                WORKFLOW_URL,

                payload,

                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }

            );

            await UPDATE(VendorApprovalRequests)

                .set({

                    workflowInstanceId: response.data.id,

                    status: 'TRIGGERED'

                })

                .where({ ID: data.ID });

            console.log("Workflow Triggered Successfully");

        } catch (err) {

    console.log("========== WORKFLOW ERROR ==========");
    console.log(JSON.stringify(err.response?.data, null, 2));

    await UPDATE(VendorApprovalRequests)
        .set({
            status: 'FAILED'
        })
        .where({ ID: data.ID });

    console.error(err.message);
}

    });

});