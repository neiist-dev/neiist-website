import "@testing-library/jest-dom";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { within } from "@testing-library/dom";
import MemberPage from "../../../pages/MemberPage";
import UserDataContext from "../../../UserDataContext.js";
import { act } from "react-dom/test-utils";
import { electionsMock, userDataMock } from "../mockData/MemberPage";

describe("MembersPage", () => {

  const renderComponent = (userdata) => {
    return render(
      <UserDataContext.Provider value={{ userData: userdata }}>
        <MemberPage />
      </UserDataContext.Provider>
    );
  };

  describe("general tests", () => {
    beforeEach(() => {
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        // Set member as null
        json: jest.fn().mockResolvedValueOnce(null),
      });
    });

    afterEach(() => {
      global.fetch.mockRestore();
      cleanup();
    });

    it("display of information", async () => {
      await act(() => {
        renderComponent(userDataMock);
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const usernameElement = await screen.getByTestId("username-container");
      expect(
        await within(usernameElement).getByText(/Username:/i)
      ).toBeInTheDocument();
      expect(
        await within(usernameElement).getByText(`${userDataMock.username}`)
      ).toBeInTheDocument();

      const nameElement = await screen.getByTestId("name-container");
      expect(await within(nameElement).getByText(/Nome:/i)).toBeInTheDocument();
      expect(
        await within(nameElement).getByText(`${userDataMock.name}`)
      ).toBeInTheDocument();

      const emailElement = await screen.getByTestId("email-container");
      expect(
        await within(emailElement).getByText(/Email:/i)
      ).toBeInTheDocument();
      expect(
        await within(emailElement).getByText(`${userDataMock.email}`)
      ).toBeInTheDocument();

      const statusElement = await screen.getByTestId("status-container");
      expect(
        await within(statusElement).getByAltText(userDataMock.status)
      ).toBeInTheDocument();
      expect(
        await within(statusElement).getByAltText(userDataMock.status)
      ).toHaveAttribute("src", `/${userDataMock.status}.svg`);
    });
  });

  describe("member not present in the DB", () => {
    beforeEach(() => {
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        // Set member as null
        json: jest.fn().mockResolvedValueOnce(null),
      });
    });

    afterEach(() => {
      global.fetch.mockRestore();
      cleanup();
    });

    it('should display button with "Registar"', async () => {
      await act(() => {
        renderComponent(userDataMock);
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const renovateButton = await screen.getByRole("button", {
        name: /registar/i,
      });
      expect(renovateButton).toBeInTheDocument();
    });

    it("should display warning div", async () => {
      await act(() => {
        renderComponent(userDataMock);
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const renovateButton = await screen.getByRole("alert");
      expect(renovateButton).toBeInTheDocument();
      expect(renovateButton).toHaveTextContent(
        /Dados retirados do Fênix e não presentes na nossa base de dados/i
      );
    });
  });

  describe("member present in the DB", () => {
    beforeEach(() => {
      jest.spyOn(global, "fetch").mockResolvedValueOnce({
        json: jest.fn().mockResolvedValueOnce(userDataMock),
      });
    });

    afterEach(() => {
      global.fetch.mockRestore();
      cleanup();
    });

    it('should display button with "Renovar" if status is "NaoSocio"', async () => {
      await act(() => {
        renderComponent(userDataMock);
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const renovateButton = await screen.getByRole("button", {
        name: /renovar/i,
      });
      expect(renovateButton).toBeInTheDocument();
    });

    it('should display button with "Renovar" if status is "Renovar"', async () => {
      userDataMock.status = "Renovar";
      await act(() => {
        renderComponent(userDataMock);
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const renovateButton = await screen.getByRole("button", {
        name: /renovar/i,
      });
      expect(renovateButton).toBeInTheDocument();
    });

    describe("SocioRegular", () => {
      it('should not display a button if status is "SocioRegular"; should display div with "Can\'t Vote"', async () => {
        userDataMock.status = "SocioRegular";
        await act(() => {
          renderComponent(userDataMock);
        });
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(await screen.queryAllByRole("button").length).toBe(0);
        expect(
          await screen.getByText(/AINDA NÃO PODES VOTAR/i)
        ).toBeInTheDocument();
      });
    });

    describe("SocioEleitor", () => {
      it("should not display a button", async () => {
        userDataMock.status = "SocioEleitor";
        global.fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce({}),
        });
        await act(() => {
          renderComponent(userDataMock);
        });
        expect(global.fetch).toHaveBeenCalledTimes(2);

        const buttons = await screen.queryAllByRole("button");
        expect(buttons.length).toBe(0);
      });

      it('when unable to get elections, display a div with "Unable to get Elections"', async () => {
        userDataMock.status = "SocioEleitor";
        global.fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce({}),
        });
        await act(() => {
          renderComponent(userDataMock);
        });
        expect(global.fetch).toHaveBeenCalledTimes(2);

        const buttons = await screen.queryAllByRole("button");
        expect(buttons.length).toBe(0);
        expect(
          await screen.getByText(/Não foi possível carregar as eleições/i)
        ).toBeInTheDocument();
      });

      it('when there isn\'t elections, display div with "No Elections"', async () => {
        userDataMock.status = "SocioEleitor";
        global.fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce([]),
        });
        await act(() => {
          renderComponent(userDataMock);
        });
        expect(global.fetch).toHaveBeenCalledTimes(2);

        const buttons = await screen.queryAllByRole("button");
        expect(buttons.length).toBe(0);
        expect(
          await screen.getByText(/Não existe atualmente eleições a decorrer/i)
        ).toBeInTheDocument();
      });

      it("when there is one election, display h1 + card information", async () => {
        userDataMock.status = "SocioEleitor";
        global.fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce([electionsMock[0]]),
        });
        const { container } = await act(() => {
          return renderComponent(userDataMock);
        });
        expect(global.fetch).toHaveBeenCalledTimes(2);

        const cardHeading = await screen.getByRole("heading", {
          name: /Eleição/i,
        });
        const cardTitle = await container.querySelector(".card-title");
        expect(cardHeading).toBeInTheDocument();
        expect(cardTitle).toBeInTheDocument();
        expect(cardTitle.textContent).toBe(electionsMock[0].name);

        // Simulate a click event on the card
        await fireEvent.click(await container.querySelector(".card"));
        expect(await screen.getByRole("dialog")).toBeInTheDocument();
      });

      it("when there is n elections, display h1 and card information for each one", async () => {
        userDataMock.status = "SocioEleitor";
        global.fetch.mockResolvedValueOnce({
          json: jest.fn().mockResolvedValueOnce(electionsMock),
        });
        const { container } = await act(() => {
          return renderComponent(userDataMock);
        });
        expect(global.fetch).toHaveBeenCalledTimes(2);

        const cardHeading = await screen.getByRole("heading", {
          name: /Eleições/i,
        });
        const cardTitles = await container.querySelectorAll(".card-title");
        expect(cardHeading).toBeInTheDocument();
        cardTitles.forEach((cardTitle, index) => {
          expect(cardTitle).toBeInTheDocument();
          expect(cardTitle.textContent).toBe(electionsMock[index].name);
        });
      });
    });
  });
});
