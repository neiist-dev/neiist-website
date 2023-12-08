import { useEffect, useState } from "react";
import { CreateEmailsModal } from "./modals/EmailsModal.jsx";
import { Badge, Button } from "@mantine/core";

import LoadSpinner from "../../hooks/loadSpinner.jsx";
import useWindowSize from "../../hooks/useWindowSize.jsx";
import { CreateMoreInfoModal } from "./modals/InformationalModal.jsx";

import style from "../../pages/css/GacPage.module.css";
import { fetchAllMembers } from "../../Api.service.js";

export const SearchMembers = ({ keySelected }) => {
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
			fetchAllMembers()
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