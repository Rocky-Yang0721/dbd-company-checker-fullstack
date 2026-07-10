import api from "./api";

export const getCompanies = async (params = {}) => {
  const response = await api.get("/companies", {
    params,
  });

  return response.data;
};

export const getSearchHistory = async (limit = 10) => {
  const response = await api.get("/companies/history", {
    params: {
      limit,
    },
  });

  return response.data;
};

export const getCompanyById = async (id) => {
  const response = await api.get(`/companies/${id}`);

  return response.data;
};

export const createCompany = async (companyData) => {
  const response = await api.post(
    "/companies",
    companyData
  );

  return response.data;
};

export const importCompanies = async (
  companies,
  fileName = ""
) => {
  const response = await api.post(
    "/companies/import",
    {
      companies,
      fileName,
    }
  );

  return response.data;
};

export const bulkSearchCompanies = async (
  companies,
  options = {}
) => {
  const {
    fileName = "",
    searchType = "BULK_SEARCH",
  } = options;

  const response = await api.post(
    "/companies/bulk-search",
    {
      companies,
      fileName,
      searchType,
    }
  );

  return response.data;
};

export const updateCompany = async (
  id,
  companyData
) => {
  const response = await api.put(
    `/companies/${id}`,
    companyData
  );

  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await api.delete(
    `/companies/${id}`
  );

  return response.data;
};