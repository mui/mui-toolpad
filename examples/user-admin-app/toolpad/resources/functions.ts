import { createFunction } from '@mui/toolpad/server';

const customers = [
  {
    id: 1,
    name: 'Emily Lee',
    account_creation_date: '2022-03-15',
    country_of_residence: 'Brazil',
    phone_number: 9876543210,
    email: 'emilylee@example.com',
    address: '123 Main St, Sao Paulo, Brazil',
    gender: 'Female',
    id_1: 'ABC123',
    image: 'https://i.pravatar.cc/300',
  },
  {
    id: 2,
    name: 'Liam Patel',
    account_creation_date: '2022-02-02',
    country_of_residence: 'India',
    phone_number: 8765432109,
    email: 'liampatel@example.com',
    address: '456 Park Rd, Mumbai, India',
    gender: 'Male',
    id_1: 'XYZ789',
    image: 'https://i.pravatar.cc/300',
  },
  {
    id: 3,
    name: 'Emma Garcia',
    account_creation_date: '2022-01-23',
    country_of_residence: 'Spain',
    phone_number: 7654321098,
    email: 'emmagarcia@example.com',
    address: '789 Oak Ave, Madrid, Spain',
    gender: 'Female',
    id_1: 'PQR456',
    image: 'https://i.pravatar.cc/300',
  },
  {
    id: 4,
    name: 'William Wong',
    account_creation_date: '2022-04-08',
    country_of_residence: 'United States',
    phone_number: 6543210987,
    email: 'williamwong@example.com',
    address: '456 Elm St, San Francisco, CA, USA',
    gender: 'Male',
    id_1: 'DEF789',
    image: 'https://i.pravatar.cc/300',
  },
  {
    id: 5,
    name: 'Ava Kim',
    account_creation_date: '2022-02-14',
    country_of_residence: 'South Korea',
    phone_number: 5432109876,
    email: 'avakim@example.com',
    address: '321 Maple St, Seoul, South Korea',
    gender: 'Female',
    id_1: 'LMN012',
    image: 'https://i.pravatar.cc/300',
  },
  {
    id: 6,
    name: 'Ethan Chen',
    account_creation_date: '2022-03-01',
    country_of_residence: 'China',
    phone_number: 4321098765,
    email: 'ethanchen@example.com',
    address: '789 Pine Rd, Beijing, China',
    gender: 'Male',
    id_1: 'UVW234',
    image: 'https://i.pravatar.cc/300',
  },
];

export async function getCustomers() {
  return customers;
}

export const addCustomer = createFunction(
  async ({ parameters }) => {
    customers.push({
      name: parameters.name,
      id: parameters.id,
      account_creation_date: parameters.account_creation_date,
      country_of_residence: parameters.country_of_residence,
      phone_number: parameters.phone_number,
      email: parameters.email,
      address: parameters.address,
      gender: parameters.gender,
      id_1: parameters.id_1,
      image: parameters.image,
    });
    return customers[customers.length - 1];
  },
  {
    parameters: {
      id: {
        typeDef: { type: 'number' },
      },
      name: {
        typeDef: { type: 'string' },
      },
      account_creation_date: {
        typeDef: { type: 'string', format: 'date' },
      },
      country_of_residence: {
        typeDef: { type: 'string' },
      },
      phone_number: {
        typeDef: { type: 'number' },
      },
      email: {
        typeDef: { type: 'string', format: 'email' },
      },
      address: {
        typeDef: { type: 'string' },
      },
      gender: {
        typeDef: { type: 'string', enum: ['Male', 'Female', 'Other'] },
      },
      id_1: {
        typeDef: { type: 'string' },
      },
      image: {
        typeDef: { type: 'string', format: 'uri' },
      },
    },
  },
);
