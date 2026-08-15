import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const fetchCollections = async () => {
  // const response = await API.get('/collections');

  // return response.data.collections;
  return [
      'users',
      'products',
      'orders',
      'customers',
      'employees',
    ];
};