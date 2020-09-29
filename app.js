const express = require('express');
const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require("@azure/identity");

const fs = require('fs');
const readline = require('readline');
const { json } = require('express');

const app = express();

const port = 3000;

const products = [
    {
      id: 1,
      name: "hammer",
    },
    {
      id: 2,
      name: "screwdriver",
    },
    {
      id: 3,
      name: "wrench",
    },
];

const customers = [
    {
        id: 1,
        name: "Steven",
        address: "Some place, somewhere"
    },
    {
        id: 2,
        name: "Judy",
        address: "Some place, somewhere"
    }
]

const orders = [
    {
        id: 1,
        customer: 1,
        items: [
            {
                id: 1,
                productid: 3,
                quantity: 1
            },
            {
                id: 2,
                productid: 1,
                quantity: 2
            }
        ]
    },
    {
        id: 2,
        customer: 2,
        items: [
            {
                id: 1,
                productid: 2,
                quantity: 2
            },
            {
                id: 2,
                productid: 3,
                quantity: 1
            }
        ]
    }
];

/**
 * 
 * @param {BlobServiceClient} blobServiceClient 
 */
async function getContainerForToday(blobServiceClient) {
    let [month, date, year] = ( new Date() ).toLocaleDateString().split("/");
    const containerName = month+date+year;

    const containerClient = blobServiceClient.getContainerClient(containerName);
    containerClient.createIfNotExists();

    return containerClient;

}


async function logrequest(req, blobServiceClient) {
    let logData = req.url + " " + req.headers['user-agent'] + '\n';
    console.log(logData);
    // Create a container if does not exist
    let containerClient = await getContainerForToday(blobServiceClient);
    let appendBlobClient = await containerClient.getAppendBlobClient("logfile");
    appendBlobClient.createIfNotExists();
    
    await appendBlobClient.appendBlock(logData, Buffer.byteLength(logData)).catch(function handleError(err) {
        console.error("Error running sample:", err.message);
    });
}

async function main() {
  // Enter your storage account name
  const account = process.env.ACCOUNT_NAME || "track12uxstudy";

  // Azure AD Credential information is required to run this sample:
  if (
    !process.env.AZURE_TENANT_ID ||
    !process.env.AZURE_CLIENT_ID ||
    !process.env.AZURE_CLIENT_SECRET
  ) {
    console.warn(
      "Azure AD authentication information not provided, but it is required to run this sample. Exiting."
    );
    return;
  }

  // ONLY AVAILABLE IN NODE.JS RUNTIME
  // DefaultAzureCredential will first look for Azure Active Directory (AAD)
  // client secret credentials in the following environment variables:
  //
  // - AZURE_TENANT_ID: The ID of your AAD tenant
  // - AZURE_CLIENT_ID: The ID of your AAD app registration (client)
  // - AZURE_CLIENT_SECRET: The client secret for your AAD app registration
  //
  // If those environment variables aren't found and your application is deployed
  // to an Azure VM or App Service instance, the managed service identity endpoint
  // will be used as a fallback authentication source.
  const defaultAzureCredential = new DefaultAzureCredential();

  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    defaultAzureCredential
  );

app.get('/', (req, res) => res.send('Hello World!'));

app.get("/products", (req,res) => {
   res.json(products);
  });

app.get("/customers", (req, res) => {
    res.json(customers);
});


  app.get('/products/:id', (req, res) => {
    // handle this request `req.params.id`
    logrequest(req, blobServiceClient);
    let id = parseInt(req.params.id);
    let product = products.find(x => id == x.id);
    res.json(product);
  })

  app.get('/customers/:id', (req, res) => {
    // handle this request `req.params.id`
    let id = parseInt(req.params.id);
    let customer = customers.find(x => id == x.id);
    res.json(customer);
  })

app.listen(port, () => console.log(`Example app listening on port ${port}!`));


}

main().catch((err) => {
  console.error("Error running sample:", err.message);
});