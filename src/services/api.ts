import axios from 'axios';

export const api = axios.create({
  // Esta é a URL base do nosso back-end Spring Boot
  baseURL: 'http://localhost:8080/api/v1',
});