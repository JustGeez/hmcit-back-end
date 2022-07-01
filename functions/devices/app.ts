import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

const ddb = new AWS.DynamoDB.DocumentClient();

export const lambdaHandler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  let response: APIGatewayProxyResultV2;
  let body;

  console.log('Function executing!');

  try {
    switch (event.routeKey) {
      case 'POST /devices':
        if (event.body) {
          const { name, retailer, price, imgUrl, thoughts, offerUrl, techSpecs } = JSON.parse(
            event.body,
          );

          const id = nanoid();
          console.log('Adding new device to database', id);

          await ddb
            .put({
              TableName: 'DevicesTable',
              Item: {
                id,
                name: name,
                retailer: retailer,
                price: price,
                imgUrl: imgUrl,
                thoughts: thoughts,
                offerUrl: offerUrl,
                techSpecs: techSpecs, //TODO add method for child objects with better visibility
                dateUpdated: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }),
              },
            })
            .promise();

          body = {
            message: `Added new device ${id} to DB`,
            id,
          };
        }
        break;

      case 'GET /devices/{id}':
        if (event.pathParameters) {
          body = await ddb
            .get({
              TableName: 'DevicesTable',
              Key: { id: event.pathParameters.id },
            })
            .promise();
        }
        break;

      case 'GET /devices':
        body = await ddb.scan({ TableName: 'DevicesTable' }).promise();
        break;

      case 'PUT /devices/{id}':
        if (!event.body) break;
        if (!event.pathParameters) break;

        break;

      case 'DELETE /devices/{id}':
        if (event.pathParameters) {
          body = await ddb
            .delete({ TableName: 'DevicesTable', Key: { id: event.pathParameters.id } })
            .promise();
        }
        break;

      // TEST ROUTE ONLY
      case 'GET /devices/populateDatabaseWithTestData':
        await ddb
          .batchWrite({
            RequestItems: {
              DevicesTable: [
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      name: 'HP Spectre x360 14',
                      retailer: 'Incredible Connection',
                      price: "R34'999.00",
                      imgUrl:
                        'https://www.incredible.co.za/media/catalog/product/cache/7ce9addd40d23ee411c2cc726ad5e7ed/c/0/c07182636_6068.png',
                      thoughts:
                        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ad maxime harum perspiciatis nisi? Rem quia obcaecati voluptatum nostrum reprehenderit dolor voluptates sunt quidem ipsam natus quam, adipisci autem quibusdam! Exercitationem!',
                      offerUrl:
                        'https://www.incredible.co.za/hp-spectre-x360-14-core-i7-1165g7-16gb-ram-1tb-ssd-storage-2-in-1-laptop',
                      techSpecs: {
                        os: 'windows',
                        screenSize: '14inch',
                        touchScreen: 'no',
                        processor: 'Core i7 1165G7',
                        graphics: 'Intel Iris Xe',
                        ram: '16Gb DDR4 soldered',
                        storage: '1TB SSD',
                        batteryLife: '12 hours',
                        color: 'Silver',
                        warranty: '3 years',
                        build: 'Aluminium',
                        ports: ['usb-a x2', 'usb-c thunderbolt 4 x1', 'charger', 'microSD'],
                        uses: ['3d Modeling', 'Heavy gaming', 'Programming', 'Office'],
                      },
                      dateUpdated: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      name: 'Dell XPS 7390',
                      retailer: 'Incredible Connection',
                      price: "R32'999.00",
                      imgUrl:
                        'https://www.incredible.co.za/media/catalog/product/cache/7ce9addd40d23ee411c2cc726ad5e7ed/d/e/dell_03_e9a8.jpg',
                      thoughts:
                        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ad maxime harum perspiciatis nisi? Rem quia obcaecati voluptatum nostrum reprehenderit dolor voluptates sunt quidem ipsam natus quam, adipisci autem quibusdam! Exercitationem!',
                      offerUrl:
                        'https://www.incredible.co.za/dell-xps-7390-i7-1051u-16-512-fhd-laptop',
                      techSpecs: {
                        os: 'windows',
                        screenSize: '13.3inch',
                        touchScreen: 'yes',
                        processor: 'Core i7 10510U',
                        graphics: 'Intel Iris Xe',
                        ram: '16Gb DDR3 soldered',
                        storage: '512Gb NVME SSD',
                        batteryLife: '15 hours',
                        color: 'Silver',
                        warranty: '3 years',
                        build: 'Aluminium',
                        ports: ['usb-a x2', 'usb-c x1', 'charger', 'microSD'],
                        uses: ['3d Modeling', 'Heavy gaming', 'Programming', 'Office'],
                      },
                      dateUpdated: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      name: 'Acer Nitro 5',
                      retailer: 'Incredible Connection',
                      price: "R32'999.00",
                      imgUrl:
                        'https://www.incredible.co.za/media/catalog/product/cache/7ce9addd40d23ee411c2cc726ad5e7ed/n/i/nitro5_an515_45_bl1_rgb_bk_01a__1__cd4b.jpg',
                      thoughts:
                        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ad maxime harum perspiciatis nisi? Rem quia obcaecati voluptatum nostrum reprehenderit dolor voluptates sunt quidem ipsam natus quam, adipisci autem quibusdam! Exercitationem!',
                      offerUrl:
                        'https://www.incredible.co.za/acer-nitro-5-ryzen-7-5800h-16gb-ram-1tb-ssd-geforce-rtx-3060-gaming-laptop',
                      techSpecs: {
                        os: 'windows',
                        screenSize: '15inch',
                        touchScreen: 'no',
                        processor: 'Ryzen 7 5800H',
                        graphics: 'RTX3060 6Gb',
                        ram: '16Gb DDR4 soldered',
                        storage: '1TB SSD',
                        batteryLife: '4 hours',
                        color: 'Black',
                        warranty: '3 years',
                        build: 'Plastic',
                        ports: ['usb-a x2', 'usb-c x1', 'charger', 'microSD'],
                        uses: ['3d Modeling', 'Heavy gaming', 'Programming', 'Office'],
                      },
                      dateUpdated: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      name: 'HP OMEN 16',
                      retailer: 'Incredible Connection',
                      price: "R34'999.00",
                      imgUrl:
                        'https://www.incredible.co.za/media/catalog/product/cache/7ce9addd40d23ee411c2cc726ad5e7ed/4/9/492y6ea_3_4766.jpg',
                      thoughts:
                        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ad maxime harum perspiciatis nisi? Rem quia obcaecati voluptatum nostrum reprehenderit dolor voluptates sunt quidem ipsam natus quam, adipisci autem quibusdam! Exercitationem!',
                      offerUrl:
                        'https://www.incredible.co.za/hp-omen-ryzen-7-5800h-16gb-ram-1tb-ssd-storage-rtx-3070-gaming-laptop',
                      techSpecs: {
                        os: 'windows',
                        screenSize: '16inch', //TODO: Add refresh rate spec
                        touchScreen: 'no',
                        processor: 'Ryzen 7 5800H',
                        graphics: 'RTX3070 8Gb',
                        ram: '16Gb DDR4 soldered',
                        storage: '1TB SSD',
                        batteryLife: '4 hours',
                        color: 'Black',
                        warranty: '3 years',
                        build: 'Plastic',
                        ports: ['usb-a x2', 'usb-c x1', 'charger', 'microSD'],
                        uses: ['3d Modeling', 'Heavy gaming', 'Programming', 'Office'],
                      },
                      dateUpdated: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    },
                  },
                },
                {
                  PutRequest: {
                    Item: {
                      id: nanoid(),
                      name: 'Apple Macbook Pro M1',
                      retailer: 'Incredible Connection',
                      price: "R33'999.00",
                      imgUrl:
                        'https://www.incredible.co.za/media/catalog/product/cache/7ce9addd40d23ee411c2cc726ad5e7ed/1/0/10230767_inc_94c8.jpg',
                      thoughts:
                        'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ad maxime harum perspiciatis nisi? Rem quia obcaecati voluptatum nostrum reprehenderit dolor voluptates sunt quidem ipsam natus quam, adipisci autem quibusdam! Exercitationem!',
                      offerUrl:
                        'https://www.incredible.co.za/apple-macbook-pro-13-inch-m1-chip-8-core-gpu-16gb-512gb-ssd-space-grey',
                      techSpecs: {
                        os: 'MacOS',
                        screenSize: '13.3Inch',
                        touchScreen: 'no',
                        processor: 'Apple M1',
                        graphics: 'M1 8-core GPU',
                        ram: '16Gb DDR4 soldered',
                        storage: '512GB SSD',
                        batteryLife: '18 hours',
                        color: 'Space Grey',
                        warranty: '3 years',
                        build: 'Aluminium',
                        ports: ['usb-c thunderbolt 4 x2'],
                        uses: ['3d Modeling', 'Programming', 'Office', 'Movies', 'Video editing'],
                      },
                      dateUpdated: new Date().toLocaleDateString('en-GB', { timeZone: 'UTC' }),
                    },
                  },
                },
              ],
            },
          })
          .promise();

        body = 'Loaded database with dummy data';
        break;

      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }

    response = {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*', // Allow from anywhere
        'Access-Control-Allow-Methods': 'GET, PUT, POST',
      },
      body: JSON.stringify(body),
    };
  } catch (err) {
    console.log(err);
    response = {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*', // Allow from anywhere
        'Access-Control-Allow-Methods': 'GET, PUT, POST',
      },
      body: JSON.stringify({
        message: 'some error happened',
      }),
    };
  }

  return response;
};
