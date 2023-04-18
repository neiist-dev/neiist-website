import '@testing-library/jest-dom'
import { render, screen, cleanup } from '@testing-library/react';
import MemberPage from "../MemberPage";
import UserDataContext from '../../UserDataContext';
import { act } from 'react-dom/test-utils';

describe('MembersPage', () => {
  const userDataMock = {
    "username": "ist123456",
    "displayName": "Mock Name",
    "name": "Mock First Second Name",
    "email": "mail.mock@tecnico.ulisboa.pt",
    "courses": "MEIC-T",
    "status": "NaoSocio",
    "isActiveTecnicoStudent": true,
    "isActiveLMeicStudent": true,
    "isAdmin": false,
    "isGacMember": false,
    "isMember": true,
    "isCollab": null,
    "isCoordenator": false,
  };

  const renderComponent = ( userdata ) => {
    render(
      <UserDataContext.Provider value={{ userData: userdata }}>
        <MemberPage />
      </UserDataContext.Provider>
    );
  };

  afterEach(() => {
    global.fetch.mockRestore();
    cleanup();
  });

  describe('general tests', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        // Set member as null
        json: jest.fn().mockResolvedValueOnce(null),
      });
    });

    it('display of information', ()=> {
      //PASS
    })
  });

  describe('member not present in the DB', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        // Set member as null
        json: jest.fn().mockResolvedValueOnce(null),
      });
    });

    it('should display button with "Registar"', async () => {
      await act(() => { renderComponent(userDataMock); });
      const renovateButton = await screen.getByRole('button', { name: /registar/i });
      expect(renovateButton).toBeInTheDocument();
    });

    it('should display warning div', async () => {
      await act(() => { renderComponent(userDataMock); });
      const renovateButton = await screen.getByRole('alert');
      expect(renovateButton).toBeInTheDocument();
      expect(renovateButton).toHaveTextContent(/Dados retirados do Fênix e não presentes na nossa base de dados/i);
    })
  });

  describe('member present in the DB', () => {
    beforeEach(() => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(userDataMock),
      });
    });

    it('should display button with "Renovar" if status is "Renovar" or "NaoSocio"', async () => {
      await act(() => { renderComponent(userDataMock); });
      const renovateButton = await screen.getByRole('button', { name: /renovar/i });
      expect(renovateButton).toBeInTheDocument();
    });
  });
});