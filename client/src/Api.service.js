const apiCall = (request) => 
  fetch(request)
    .then((res) => res.json())
    .catch((err) => console.error(err));


    
export const fetchCollabInformation = (username) =>
  apiCall(`/api/collabs/info/${username}`);
export const fetchAllCollabs = () => apiCall(`/api/collabs/all`);
export const fetchCollabsResume = () => apiCall(`/api/collabs/resume`);
export const fetchAllMembers = () => apiCall(`/api/mag/all`);
export const fetchActiveMembers = () => apiCall(`/api/mag/active`);
export const fetchMemberRenewalNotifications = () => 
  apiCall(`/api/mag/renewalNotifications`);
export const fetchMember = (username) => apiCall(`/api/members/${username}`);
export const fetchMemberStatus = (username) => 
  apiCall(`/api/members/status/${username}`);
    
export const fetchThesis = () => apiCall('/api/theses');
export const fetchThesisAreas = () => apiCall('/api/areas');
export const fetchElections = () => apiCall('/api/elections');
export const fetchAdminElections = () => apiCall(`/api/admin/elections`);