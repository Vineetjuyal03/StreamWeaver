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

export const uploadCSV = async (file, mapping, transformations = []) => {
    const formData = new FormData();
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('transformations', JSON.stringify(transformations));
    formData.append('file', file);

    try {
        const response = await axios.post(
            'http://localhost:5000/api/import/upload',
            formData
            // no timeout set — axios defaults to 0 (wait indefinitely)
        );
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || err.message || 'Upload failed');
    }
};