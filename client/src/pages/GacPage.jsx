import React, { useState, useEffect } from "react";
import LoadSpinner from "../hooks/loadSpinner";
import { Badge, Tooltip } from "@mantine/core";
import { Tabs } from "@mantine/core";

import { MembersTable } from "../components/gacPage/MembersTable";

import style from "./css/GacPage.module.css";
import { AllMembersPage } from "../components/gacPage/AllMembersPage";
import { EmailsAndRenewalButtons } from "../components/gacPage/EmailsAndRenewalButtons";

const GacPage = () => {
  const [activeTab, setActiveTab] = useState('active');

  return (
  <div>
    <Tabs
      className={style.mainPage}
      variant="pills"
      color="gray"
      defaultValue="active"
      onTabChange={setActiveTab}
    >
      <Tabs.List
        style={{
          display: "flex",
          zIndex: "2",
          position: "absolute",
          right: "0",
        }}
      >
        <Tabs.Tab style={{ fontWeight: "bold" }} value="active">
          Sócios Ativos
        </Tabs.Tab>
        <Tabs.Tab style={{ fontWeight: "bold" }} value="all">
          Todos os Sócios
        </Tabs.Tab>
				<Tabs.Tab style={{ fontWeight: "bold" }} value="search">
          Pesquisa
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="active" pt="xs">
        <ActiveMembersPage keySelected={activeTab} />
      </Tabs.Panel>
      <Tabs.Panel value="all" pt="xs">
        <AllMembersPage keySelected={activeTab} />
      </Tabs.Panel>
			<Tabs.Panel value="search" pt="xs">
        <SearchMembers keySelected={activeTab} />
      </Tabs.Panel>
    </Tabs>
  </div>
  );
};

const ActiveMembersPage = ({ keySelected }) => {
  const [activeMembers, setMembers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (keySelected === "active" && activeMembers === null) {
      fetch("/api/mag/active")
        .then((res) => res.json())
        .then((membersRes) => {
          setMembers(membersRes);
        })
        .catch((err) => {
          setError(err);
        });
    }
  }, [keySelected]);

  return (
    <>
      {error && (
        <div>
          Erro:
          {error.message}
        </div>
      )}
      {!error && (
        <RenderActiveMembersDiv activeMembers={activeMembers}/>
      )}
    </>
  );
};

const RenderActiveMembersDiv = ({ activeMembers }) => (
  <div>
    <div className={style.principalBody}>
      <h1>
        <b>Sócios Ativos</b>{" "}
        <span style={{ fontSize: "25px" }}>({activeMembers?.length ?? 0})</span>
      </h1>
      <div className={style.badgeAndEmailButtons}>
        <div className={style.badgeDiv}>
          <Badge
            className={style.initialBadge}
            variant="filled"
            size="xl"
          >
            {
              activeMembers?.filter((member) => member.status === "SocioRegular")
                .length ?? 0
            }{" "}
            Regulares
          </Badge>
          <Tooltip
            position="right"
            withArrow
            transitionProps={{ duration: 100 }}
            label={`${
              activeMembers?.filter((member) => member.status === "SocioEleitor")
                .length ?? 0
            } Socios Eleitores, ${
              activeMembers?.filter((member) => member.status === "Renovar")
                .length ?? 0
            } em Renovação`}
          >
            <Badge
              className={style.initialBadge}
              variant="gradient"
              gradient={{ from: "lime", to: "red" }}
              size="xl"
            >
              {
              activeMembers?.filter(
                (member) =>
                  member.status === "SocioEleitor" ||
                  member.status === "Renovar"
              ).length ?? 0
              }{" "}
              Eleitores
            </Badge>
          </Tooltip>
        </div>
        {activeMembers &&
          <EmailsAndRenewalButtons members={activeMembers} />
        }
      </div>
      <hr />
    </div>
      {activeMembers ?
        <MembersTable members={activeMembers} />
        :
        <LoadSpinner/>
      }
  </div>
);

const SearchMembers = ({ keySelected }) => {
	const [allMembers, setMembers] = useState(null);
	const [filteredMembers, setFilteredMembers] = useState([]);

	const [searchInput, setSearchInput] = useState("");

	const [error, setError] = useState(null);
	const [isLoaded, setIsLoaded] = useState(false);

	const [showEmails, setShowEmails] = useState(false);
	const handleShowEmails = () => setShowEmails(true);
	const handleCloseEmails = () => setShowEmails(false);

	useEffect(() => {
		if (keySelected === "search" && allMembers === null) {
			fetch("/api/mag/all")
				.then((res) => res.json())
				.then((membersRes) => {
					setMembers(membersRes);
					setIsLoaded(true);
				})
				.catch((err) => {
					setIsLoaded(true);
					setError(err);
				});
		}
	}, [keySelected]);

	const handleChange = (e) => {
		e.preventDefault();
		setSearchInput(e.target.value);
		const istIds = e.target.value
			.split(",")
			.map((id) => id.trim().toLowerCase());
		setFilteredMembers(
			allMembers.filter((member) =>
				istIds.includes(member.username.toLowerCase())
			)
		);
	};

	return (
		<>
			<CreateEmailsModal
				show={showEmails}
				handleClose={handleCloseEmails}
				members={filteredMembers}
			/>
			{!isLoaded && <LoadSpinner />}
			{error && (
				<div>
					Erro:
					{error.message}
				</div>
			)}
			{allMembers && (
				<div>
					<div className={style.principalBody}>
						<h1>
							<b>Pesquisa</b>
						</h1>
						<div>
							<h4>
								<input
									type="text"
									value={searchInput}
									onChange={handleChange}
									placeholder="Pesquisa por IST id..."
								/>
							</h4>
							<Button onClick={handleShowEmails}>[Emails]</Button>
						</div>
						<SearchMembersTable members={filteredMembers} />
					</div>
				</div>
			)}
		</>
	);
};

const SearchMembersTable = ({ members }) => {
	return (
		<>
			{Object.values(members).map((member, index) => (
				<div key={index}>
					<SearchMember member={member} />
				</div>
			))}
		</>
	);
};

const SearchMember = ({ member }) => {
	const windowSize = useWindowSize();

	const [showMoreInfo, setShowMoreInfo] = useState(false);
	const handleShowMoreInfo = () => setShowMoreInfo(true);
	const handleCloseMoreInfo = () => setShowMoreInfo(false);

	return (
		<>
			<CreateMoreInfoModal
				show={showMoreInfo}
				handleClose={handleCloseMoreInfo}
				username={member.username}
			/>
			<div className={style.memberInfoDiv}>
				<div className={style.memberImageContainer}>
					<div
						className={style.memberImage}
						style={{
							backgroundImage: `url(https://fenix.tecnico.ulisboa.pt/user/photo/${member.username}?s=10000)`,
						}}
					/>
					<Badge className={style.memberCourse}>
						{member.courses.replaceAll(",", ", ")}
					</Badge>
				</div>
				<div className={style.memberInfo}>
					<p>{member.username}</p>
					<p>{member.name}</p>
					<div
						className={style.buttonsSearch}
						onClick={() => handleShowMoreInfo()}
					>
						<img
							style={
								windowSize.innerWidth < 850
									? { width: "100px" }
									: { width: "auto" }
							}
							src={`${process.env.PUBLIC_URL}/${member.status}.svg`}
						/>
					</div>
				</div>
			</div>
		</>
	);
};

export default GacPage;
