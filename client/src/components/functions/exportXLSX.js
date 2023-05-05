import { utils as XLSXUtils, write as XLSXWrite } from 'xlsx';
import { extendedTeamAndCoorNames } from './collabsGeneral';

function s2ab(s) {
  const buf = new ArrayBuffer(s.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
  return buf;
}

function saveAs(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
}

export const downloadCurrentCollabsFile = () => {
  fetch('/api/collabs/all')
  .then(response => response.json())
  .then(data => {
    return data.map((collab) => {
      collab.teams = collab.teams
        .split(",")
        .map((teamName) => extendedTeamAndCoorNames[teamName])
        .join(", ");
      collab.campus = {'T': 'Taguspark', 'A': 'Alameda'}[collab.campus];
      return collab;
    });
  })
  .then(data => {
    const workbook = XLSXUtils.book_new();
    const worksheet = XLSXUtils.json_to_sheet(data);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    const worksheetName = `${currentMonth}_${currentYear}`;
    const fileName = `currentCollabs_${worksheetName}.xlsx`;

    XLSXUtils.book_append_sheet(workbook, worksheet, worksheetName);
    const file = XLSXWrite(workbook, { bookType: 'xlsx', type: 'binary' });
    saveAs(new Blob([s2ab(file)], { type: 'application/octet-stream' }), fileName);
  })
  .catch(error => console.error(error));
};


export const downloadActiveMembersFile = () => {
  fetch('/api/mag/active')
  .then(response => response.json())
  .then(data => {
    const workbook = XLSXUtils.book_new();
    const worksheet = XLSXUtils.json_to_sheet(data);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().toLocaleString('default', { month: '2-digit' });
    const currentDay = new Date().toLocaleString('default', { day: '2-digit' });

    const worksheetName = `${currentDay}-${currentMonth}-${currentYear}`;
    const fileName = `NEIIST_SociosAtivos_${worksheetName}.xlsx`;

    XLSXUtils.book_append_sheet(workbook, worksheet, worksheetName);
    const file = XLSXWrite(workbook, { bookType: 'xlsx', type: 'binary' });
    saveAs(new Blob([s2ab(file)], { type: 'application/octet-stream' }), fileName);
  })
  .catch(error => console.error(error));
};
