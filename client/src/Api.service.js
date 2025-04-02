import axios from 'axios';

const apiCall = (url, method='GET', body=null, headers=null) =>
  axios(url, { method, data: body, headers })
    .then((res) => res.data)
    .catch((err) => {
      console.error(err)
      if (err.status === 401 || err.status === 403) {
        window.location.href = '/';
        return;
      }
    });

    
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
export const removeCollab = (username) => apiCall(`/api/collabs/remove/${username}`, 'POST');
export const addCollab = (username, info) => apiCall(`/api/collabs/add/${username}`, 'POST', info);
export const updateEmail = (username, email) => apiCall(`/api/mag/update/email/${username}`, 'POST', {changedEmail: email});
export const updateMember = (username, { name, email, courses }) =>
  apiCall(`/api/members/${username}`, 'PUT', { name, email, courses });
export const deleteMagMember = (username) =>
  apiCall(`/api/mag/delete/${username}`, 'PUT');
export const warnMember = (username) =>
  apiCall(`/api/mag/warnedMember/${username}`, 'POST');
export const createArea = (data) =>
  apiCall(`/api/areas`, 'POST', data, { 'Content-Type': 'multipart/form-data' });
export const createElection = (election) =>
  apiCall(`/api/elections`, 'POST', election);
export const createThesis = (thesis) =>
  apiCall(`/api/theses`, 'POST', thesis, { 'Content-Type': 'multipart/form-data' });
export const createMember = (member) =>
  apiCall(`/api/members`, 'POST', member);
export const voteElection = (electionId, vote) =>
  apiCall(`/api/elections/${electionId}/votes`, 'POST', vote);