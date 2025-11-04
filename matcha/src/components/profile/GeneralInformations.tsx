"use client";
import React, { useEffect, useState } from "react";
import PicturesPicker from "../../utils/PicturePickers";
import TagsInput from "../../utils/TagInput";
import ProfileSection from "./ProfileSection";
import GenderEditor from "./editors/GenderEditor";
import SexualPreferencesEditor from "./editors/SexualPreferencesEditor";
import BiographyEditor from "./editors/BiographyEditor";
import EmailEditor from "./editors/EmailEditor";
import FirstnameEditor from "./editors/FirstnameEditor";
import LastnameEditor from "./editors/LastnameEditor";
import BirthdateEditor from "./editors/BirthdateEditor";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import api from "../../services/api";

export default function GeneralInformations() {
  // Récupérer l'utilisateur connecté depuis l'API
  const { currentUser, loading } = useCurrentUser();
  
  const [editMode, setEditMode] = useState<number>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [pictures, setPictures] = useState<File[]>([]);
  const [profilePicIdx, setProfilePicIdx] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [gender, setGender] = useState<string>("Woman");
  const [sexualPreferences, setSexualPreferences] = useState<string>("");
  const [biography, setBiography] = useState<string>("");
  const [geolocalisation, setGeolocalisation] = useState<{
    choice: boolean;
    localisation: string;
  }>({ choice: true, localisation: "" });
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [birthdate, setBirthdate] = useState<Date | null>(null);

  // Charger les données de l'utilisateur connecté
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email || "");
      setFirstName(currentUser.firstName || "");
      setLastName(currentUser.lastName || "");
      setGender(currentUser.gender || "Woman");
      setSexualPreferences(currentUser.preferences || "");
      setBiography(currentUser.bio || "");
      setInterests(currentUser.interests || []);
      setBirthdate(currentUser.birthdate || null);
      
      if (currentUser.location) {
        setCurrentLocation({
          latitude: currentUser.location.lat,
          longitude: currentUser.location.lng,
        });
      }
    }
  }, [currentUser]);

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
  const [draftGeolocalisation, setDraftGeolocalisation] = useState<{
    choice: boolean;
    localisation: string;
  }>({ choice: false, localisation: "" });
  const [locationError, setLocationError] = useState<string>("");
  const [draftBirthdate, setDraftBirthdate] = useState<Date | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isDraftEmailValid =
    emailRegex.test(draftEmail) && draftEmail.trim().length > 0;
  const isDraftFirstNameValid = draftFirstName.trim().length > 0;
  const isDraftLastNameValid = draftLastName.trim().length > 0;
  const isDraftBirthdateValid = (() => {
    if (!draftBirthdate) return false;
    const today = new Date();
    const adult = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    return draftBirthdate <= adult && draftBirthdate >= new Date(1900, 0, 1);
  })();

  function formatDateFR(d: Date | null) {
    if (!d) return "Not set";
    const dd = d.getDate().toString().padStart(2, "0");
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  useEffect(() => {
    if (draftGeolocalisation.choice) {
      if (!navigator.geolocation) {
        const ipGeolocation = async () => {
          try {
            const response = await fetch("https://ipapi.co/json/");
            const data = await response.json();
            setGeolocalisation((prev) => ({
              ...prev,
              localistion: `${data.city}, ${data.region}`,
            }));
          } catch (error) {
            console.error("Error getting IP geolocation: ", error);
          }
        };
        ipGeolocation();
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationError(
              "Location access was denied. To use this feature, please enable location permissions in your browser settings."
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            setLocationError(
              "Your location information is currently unavailable."
            );
          } else if (error.code === error.TIMEOUT) {
            setLocationError("The request to get your location timed out.");
          }
          setGeolocalisation({ choice: false, localisation: "" });
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        }
      );
    }
  }, [draftGeolocalisation.choice]);

  useEffect(() => {
    if (currentLocation) {
      const reverseGeocode = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.latitude}&lon=${currentLocation.longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "Matcha",
              },
            }
          );
          const data = await response.json();
          setDraftGeolocalisation((prev) => ({
            ...prev,
            localisation: data.display_name,
          }));
        } catch (error) {
          console.error("Error reverse geocoding: ", error);
        }
      };
      reverseGeocode();
    }
  }, [currentLocation]);

  const handleEditGender = () => {
    setDraftGender(gender);
    setEditMode(1);
  };
  const handleSaveGender = async () => {
    const result = await api.updateProfile({ gender: draftGender });
    if (result.error) {
      console.error("Error updating gender:", result.error);
      alert("Failed to update gender: " + result.error);
      return;
    }
    setGender(draftGender);
    setEditMode(0);
  };
  const handleCancelGender = () => {
    setEditMode(0);
  };

  const handleEditSexualPreferences = () => {
    setDraftSexualPreferences(sexualPreferences);
    setEditMode(2);
  };
  const handleSaveSexualPreferences = async () => {
    const result = await api.updateProfile({ orientation: draftSexualPreferences });
    if (result.error) {
      console.error("Error updating sexual preferences:", result.error);
      alert("Failed to update sexual preferences: " + result.error);
      return;
    }
    setSexualPreferences(draftSexualPreferences);
    setEditMode(0);
  };
  const handleCancelSexualPreferences = () => {
    setEditMode(0);
  };

  const handleEditBiography = () => {
    setDraftBiography(biography);
    setEditMode(3);
  };
  const handleSaveBiography = async () => {
    const result = await api.updateProfile({ bio: draftBiography });
    if (result.error) {
      console.error("Error updating biography:", result.error);
      alert("Failed to update biography: " + result.error);
      return;
    }
    setBiography(draftBiography);
    setEditMode(0);
  };
  const handleCancelBiography = () => {
    setEditMode(0);
  };

  const handleEditInterests = () => {
    setDraftInterests([...interests]);
    setEditMode(4);
  };
  const handleSaveInterests = async () => {
    const result = await api.updateTags(draftInterests);
    if (result.error) {
      console.error("Error updating interests:", result.error);
      alert("Failed to update interests: " + result.error);
      return;
    }
    setInterests(draftInterests);
    setEditMode(0);
  };
  const handleCancelInterests = () => {
    setEditMode(0);
  };

  const handleEditPictures = () => {
    setDraftPictures([...pictures]);
    setDraftProfilePicIdx(profilePicIdx);
    setEditMode(5);
  };
  const handleSavePictures = () => {
    setPictures(draftPictures);
    setProfilePicIdx(draftProfilePicIdx);
    setEditMode(0);
  };
  const handleCancelPictures = () => {
    setEditMode(0);
  };

  const handleEditEmail = () => {
    setDraftEmail(email);
    setEditMode(6);
  };
  const handleSaveEmail = async () => {
    const result = await api.updateEmail(draftEmail);
    if (result.error) {
      console.error("Error updating email:", result.error);
      alert("Failed to update email: " + result.error);
      return;
    }
    setEmail(draftEmail);
    setEditMode(0);
  };
  const handleCancelEmail = () => {
    setEditMode(0);
  };

  const handleEditFirstName = () => {
    setDraftFirstName(firstName);
    setEditMode(7);
  };
  const handleSaveFirstName = async () => {
    const result = await api.updateProfile({ first_name: draftFirstName });
    if (result.error) {
      console.error("Error updating first name:", result.error);
      alert("Failed to update first name: " + result.error);
      return;
    }
    setFirstName(draftFirstName);
    setEditMode(0);
  };
  const handleCancelFirstName = () => {
    setEditMode(0);
  };

  const handleEditLastName = () => {
    setDraftLastName(lastName);
    setEditMode(8);
  };
  const handleSaveLastName = async () => {
    const result = await api.updateProfile({ last_name: draftLastName });
    if (result.error) {
      console.error("Error updating last name:", result.error);
      alert("Failed to update last name: " + result.error);
      return;
    }
    setLastName(draftLastName);
    setEditMode(0);
  };
  const handleCancelLastName = () => {
    setEditMode(0);
  };

  const handleEditGeolocalisation = () => {
    setDraftGeolocalisation(geolocalisation);
    setEditMode(9);
  };
  const handleSaveGeolocalisation = () => {
    setGeolocalisation(draftGeolocalisation);
    setEditMode(0);
  };
  const handleCancelGeolocalisation = () => {
    setEditMode(0);
  };

  const handleEditBirthdate = () => {
    setDraftBirthdate(birthdate);
    setEditMode(10);
  };
  const handleSaveBirthdate = async () => {
    if (isDraftBirthdateValid && draftBirthdate) {
      // Formater la date au format YYYY-MM-DD pour le backend
      const formattedDate = draftBirthdate.toISOString().split('T')[0];
      const result = await api.updateProfile({ birthday: formattedDate });
      if (result.error) {
        console.error("Error updating birthdate:", result.error);
        alert("Failed to update birthdate: " + result.error);
        return;
      }
      setBirthdate(draftBirthdate);
      setEditMode(0);
    }
  };
  const handleCancelBirthdate = () => setEditMode(0);

  return (
    <>
      <div className="mt-10 md:mt-0 text-xl font-extrabold">Informations</div>
      <ul className="list bg-base-100 rounded-box shadow-md mt-2">
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
          isValid={!isDraftEmailValid}
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
          isValid={!isDraftFirstNameValid}
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
          isValid={!isDraftLastNameValid}
        />
        <ProfileSection
          label="Birthdate"
          displayValue={formatDateFR(birthdate)}
          editorComponent={
            <BirthdateEditor
              value={draftBirthdate}
              onChange={setDraftBirthdate}
              minYear={1900}
              required
            />
          }
          isEditing={editMode === 10}
          onEditClick={handleEditBirthdate}
          onSave={handleSaveBirthdate}
          onCancel={handleCancelBirthdate}
          isDisabled={editMode !== 0 && editMode !== 10}
          isValid={!isDraftBirthdateValid}
        />
        <ProfileSection
          label="Geolocalisation"
          displayValue={
            geolocalisation.localisation !== ""
              ? geolocalisation.localisation
              : "None"
          }
          editorComponent={
            <>
              <div className="flex">
                <input
                  type="radio"
                  name="gps-radio"
                  className="radio"
                  checked={geolocalisation.choice}
                  onChange={() =>
                    setGeolocalisation((prev) => ({ ...prev, choice: true }))
                  }
                  disabled={
                    !geolocalisation.choice && locationError.length !== 0
                  }
                  onClick={() =>
                    setGeolocalisation((prev) => ({ ...prev, choice: true }))
                  }
                />
                <p className="ms-4">Yes</p>
              </div>
              <div className="flex mt-4">
                <input
                  type="radio"
                  name="gps-radio"
                  className="radio"
                  checked={!geolocalisation.choice}
                  onChange={() =>
                    setGeolocalisation({ choice: false, localisation: "" })
                  }
                  onClick={() => {
                    setGeolocalisation({ choice: false, localisation: "" });
                  }}
                />
                <p className="ms-4">No</p>
              </div>
              {draftGeolocalisation.choice && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Type here"
                    className="input"
                    value={draftGeolocalisation.localisation}
                    onChange={(e) =>
                      setDraftGeolocalisation({
                        choice: true,
                        localisation: e.target.value,
                      })
                    }
                  />
                  <p className="label text-xs ms-3">
                    You can adjust the GPS position
                  </p>
                </div>
              )}
            </>
          }
          isEditing={editMode === 9}
          onEditClick={handleEditGeolocalisation}
          onSave={handleSaveGeolocalisation}
          onCancel={handleCancelGeolocalisation}
          isDisabled={editMode !== 0 && editMode !== 9}
        />
      </ul>
      <div className="toast toast-bottom toast-center z-50">
        {locationError && (
          <div className="alert alert-error shadow-lg">
            <div className="flex-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{locationError}</span>
            </div>
            <div className="flex-none">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setLocationError("")}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
