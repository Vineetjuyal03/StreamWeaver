import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000',
});
export const test= async()=>{
    return await API.get('/')
}
export const fetchCollections = async () => {
    // return ["customer"]
    const response = await API.get('/db/getCollections');

    return response.data.collections;
};

export const fetchCollectionFields = async (collectionName) => {
    return ["name","email"]
    const response = await API.get(
        `/collections/${encodeURIComponent(collectionName)}/fields`
    );

    return response.data.fields;
};