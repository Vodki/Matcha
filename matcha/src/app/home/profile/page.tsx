"use client";
import PicturesPicker from "../../../utils/PicturePickers";
import TagsInput from "../../../utils/TagInput";
import React, { useState } from "react";
import ProfileSection from "../../../components/profile/ProfileSection";
import GenderEditor from "../../../components/profile/editors/GenderEditor";
import SexualPreferencesEditor from "../../../components/profile/editors/SexualPreferencesEditor";
import BiographyEditor from "../../../components/profile/editors/BiographyEditor";
import EmailEditor from "../../../components/profile/editors/EmailEditor";
import FirstnameEditor from "../../../components/profile/editors/FirstnameEditor";
import LastnameEditor from "../../../components/profile/editors/LastnameEditor";

export default function Profile() {
  const [editMode, setEditMode] = useState<number>(0);
  const [interests, setInterests] = useState<string[]>(["prout", "cats"]);
  const [pictures, setPictures] = useState<File[]>([]);
  const [profilePicIdx, setProfilePicIdx] = useState<number>(0);
  const [email, setEmail] = useState<string>("justineemunozz@gmail.com");
  const [firstName, setFirstName] = useState<string>("Justine");
  const [lastName, setLastName] = useState<string>("Munoz");
  const [gender, setGender] = useState<string>("Woman");
  const [sexualPreferences, setSexualPreferences] =
    useState<string>("Men & Women");
  const [biography, setBiography] = useState<string>(
    "I am a 25 years-old woman"
  );

  const [draftEmail, setDraftEmail] = useState<string>("");
  const [draftFirstName, setDraftFirstName] = useState<string>("");
  const [draftLastName, setDraftLastName] = useState<string>("");
  const [draftGender, setDraftGender] = useState<string>("");
  const [draftSexualPreferences, setDraftSexualPreferences] =
    useState<string>("");
  const [draftBiography, setDraftBiography] = useState<string>("");
  const [draftInterests, setDraftInterests] = useState<string[]>([]);
  const [draftPictures, setDraftPictures] = useState<File[]>([]);
  const [draftProfilePicIdx, setDraftProfilePicIdx] = useState<number>(0);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isDraftEmailValid =
    emailRegex.test(draftEmail) && draftEmail.trim().length > 0;
  const isDraftFirstNameValid = draftFirstName.trim().length > 0;
  const isDraftLastNameValid = draftLastName.trim().length > 0;

  const handleEditGender = () => {
    setDraftGender(gender);
    setEditMode(1);
  };
  const handleSaveGender = () => {
    setGender(draftGender);
    setEditMode(0);
  };
  const handleCancelGender = () => {
    setEditMode(0);
  };

  // Préférences Sexuelles
  const handleEditSexualPreferences = () => {
    setDraftSexualPreferences(sexualPreferences);
    setEditMode(2);
  };
  const handleSaveSexualPreferences = () => {
    setSexualPreferences(draftSexualPreferences);
    setEditMode(0);
    // TODO: Appel API
  };
  const handleCancelSexualPreferences = () => {
    setEditMode(0);
  };

  // Biographie
  const handleEditBiography = () => {
    setDraftBiography(biography);
    setEditMode(3);
  };
  const handleSaveBiography = () => {
    setBiography(draftBiography);
    setEditMode(0);
    // TODO: Appel API
  };
  const handleCancelBiography = () => {
    setEditMode(0);
  };

  // Centres d'intérêt
  const handleEditInterests = () => {
    setDraftInterests([...interests]); // Copie profonde pour les tableaux
    setEditMode(4);
  };
  const handleSaveInterests = () => {
    setInterests(draftInterests);
    setEditMode(0);
    // TODO: Appel API
  };
  const handleCancelInterests = () => {
    setEditMode(0);
  };

  // Photos
  const handleEditPictures = () => {
    setDraftPictures([...pictures]); // Copie profonde
    setDraftProfilePicIdx(profilePicIdx);
    setEditMode(5);
  };
  const handleSavePictures = () => {
    setPictures(draftPictures);
    setProfilePicIdx(draftProfilePicIdx);
    setEditMode(0);
    // TODO: Appel API
  };
  const handleCancelPictures = () => {
    setEditMode(0);
  };

  // Email
  const handleEditEmail = () => {
    setDraftEmail(email);
    setEditMode(6);
  };
  const handleSaveEmail = () => {
    if (isDraftEmailValid) {
      // Vérifie la validité avant de sauvegarder
      setEmail(draftEmail);
      setEditMode(0);
      // TODO: Appel API
    } else {
      alert("Email non valide, impossible de sauvegarder.");
    }
  };
  const handleCancelEmail = () => {
    setEditMode(0);
  };

  // Prénom
  const handleEditFirstName = () => {
    setDraftFirstName(firstName);
    setEditMode(7);
  };
  const handleSaveFirstName = () => {
    if (isDraftFirstNameValid) {
      setFirstName(draftFirstName);
      setEditMode(0);
      // TODO: Appel API
    } else {
      alert("Prénom requis, impossible de sauvegarder.");
    }
  };
  const handleCancelFirstName = () => {
    setEditMode(0);
  };

  // Nom
  const handleEditLastName = () => {
    setDraftLastName(lastName);
    setEditMode(8);
  };
  const handleSaveLastName = () => {
    if (isDraftLastNameValid) {
      setLastName(draftLastName);
      setEditMode(0);
      // TODO: Appel API
    } else {
      alert("Nom requis, impossible de sauvegarder.");
    }
  };
  const handleCancelLastName = () => {
    setEditMode(0);
  };

  return (
    <div className="flex flex-col gap-2 w-full md:max-w-md mx-auto">
      <div className="mt-20 text-xl font-extrabold ms-2">Profile</div>
      <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto overflow-x-hidden md:card md:w-[430px] flex flex-col md:flex-row gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
        <ul className="list bg-base-100 rounded-box shadow-md">
          <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
            Informations
          </li>
          <ProfileSection
            label="Gender"
            displayValue={gender}
            editorComponent={
              <GenderEditor value={draftGender} onChange={setDraftGender} />
            }
            isEditing={editMode === 1}
            onEditClick={handleEditGender}
            onSave={handleSaveGender}
            onCancel={handleCancelGender}
            isDisabled={editMode !== 0 && editMode !== 1}
          />
          <ProfileSection
            label="Sexual Preferences"
            displayValue={sexualPreferences}
            editorComponent={
              <SexualPreferencesEditor
                value={draftSexualPreferences}
                onChange={setDraftSexualPreferences}
              />
            }
            isEditing={editMode === 2}
            onEditClick={handleEditSexualPreferences}
            onSave={handleSaveSexualPreferences}
            onCancel={handleCancelSexualPreferences}
            isDisabled={editMode !== 0 && editMode !== 2}
          />
          <ProfileSection
            label="Biography"
            displayValue={biography}
            editorComponent={
              <BiographyEditor
                value={draftBiography}
                onChange={setDraftBiography}
              />
            }
            isEditing={editMode === 3}
            onEditClick={handleEditBiography}
            onSave={handleSaveBiography}
            onCancel={handleCancelBiography}
            isDisabled={editMode !== 0 && editMode !== 3}
          />
          <ProfileSection
            label="Interests"
            displayValue={interests}
            editorComponent={
              <TagsInput
                interests={draftInterests}
                setInterests={setDraftInterests}
                editMode={true}
              />
            }
            isEditing={editMode === 4}
            onEditClick={handleEditInterests}
            onSave={handleSaveInterests}
            onCancel={handleCancelInterests}
            isDisabled={editMode !== 0 && editMode !== 4}
          />
          <ProfileSection
            label="Pictures"
            displayValue={
              <PicturesPicker
                pictures={pictures}
                setPictures={setPictures}
                profilePicIdx={profilePicIdx}
                setProfilePicIdx={setProfilePicIdx}
                displayMode={true}
                removeTitle={true}
              />
            }
            editorComponent={
              <PicturesPicker
                pictures={draftPictures}
                setPictures={setDraftPictures}
                profilePicIdx={profilePicIdx}
                setProfilePicIdx={setProfilePicIdx}
                removeTitle={true}
              />
            }
            isEditing={editMode === 5}
            onEditClick={handleEditPictures}
            onSave={handleSavePictures}
            onCancel={handleCancelPictures}
            isDisabled={editMode !== 0 && editMode !== 5}
          />
          <ProfileSection
            label="E-mail"
            displayValue={email}
            editorComponent={
              <EmailEditor
                value={draftEmail}
                onChange={setDraftEmail}
                isValid={isDraftEmailValid}
              />
            }
            isEditing={editMode === 6}
            onEditClick={handleEditEmail}
            onSave={handleSaveEmail}
            onCancel={handleCancelEmail}
            isDisabled={editMode !== 0 && editMode !== 6}
          />
          <ProfileSection
            label="Firstname"
            displayValue={firstName}
            editorComponent={
              <FirstnameEditor
                value={draftFirstName}
                onChange={setDraftFirstName}
                isValid={isDraftFirstNameValid}
              />
            }
            isEditing={editMode === 7}
            onEditClick={handleEditFirstName}
            onSave={handleSaveFirstName}
            onCancel={handleCancelFirstName}
            isDisabled={editMode !== 0 && editMode !== 7}
          />
          <ProfileSection
            label="Lastname"
            displayValue={lastName}
            editorComponent={
              <LastnameEditor
                value={draftLastName}
                onChange={setDraftLastName}
                isValid={isDraftLastNameValid}
              />
            }
            isEditing={editMode === 8}
            onEditClick={handleEditLastName}
            onSave={handleSaveLastName}
            onCancel={handleCancelLastName}
            isDisabled={editMode !== 0 && editMode !== 8}
          />
        </ul>
      </div>
    </div>
  );
}
