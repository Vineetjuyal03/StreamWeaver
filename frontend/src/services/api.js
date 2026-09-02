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
    console.log(response.data)
    return response.data.collections;
};

export const fetchCollectionFields = async (collectionName) => {
    return ["name","email"]
    const response = await API.get(
        `/collections/${encodeURIComponent(collectionName)}/fields`
    );

    return response.data.fields;
};

const uploadFile = async (file, mapping, transformations = [], fileType) => {
    const formData = new FormData();
    // order matters: fields must be appended before the file (Busboy processes
    // multipart parts sequentially, and the file handler checks for these
    // fields the instant the file part starts arriving)
    formData.append('mapping', JSON.stringify(mapping));
    formData.append('transformations', JSON.stringify(transformations));
    formData.append('fileType', fileType);
    formData.append('file', file);

    try {
        const response = await axios.post(
            'http://localhost:5000/api/import/upload',
            formData
            // no timeout — large files can legitimately take minutes
        );
        return response.data;
    } catch (err) {
        throw new Error(err.response?.data?.message || err.message || 'Upload failed');
    }
};

export const uploadCSV = (file, mapping, transformations = []) =>
    uploadFile(file, mapping, transformations, 'csv');

export const uploadJSON = (file, mapping, transformations = []) =>
    uploadFile(file, mapping, transformations, 'json');