"use client";

import React, { useEffect, useState } from "react";
import TagsInput from "../../utils/TagInput";
import PicturesPicker from "../../utils/PicturePickers";
import Link from "next/link";

export default function InformationsPage() {
  const [interests, setInterests] = useState<string[]>([]);
  const [pictures, setPictures] = useState<File[]>([]);
  const [profilePicIdx, setProfilePicIdx] = useState<number>(0);
  const [gender, setGender] = useState<string>("Woman");
  const [sexualPreferences, setSexualPreferences] = useState<string>("");
  const [about, setAbout] = useState<string>("");
  const [geolocalistion, setGeolocalisation] = useState<{
    choice: boolean;
    localistion: string;
  }>({ choice: true, localistion: "" });
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const isAboutValid = about.trim().length > 0;
  const isInterestsValid = interests.length > 0;
  const isPicturesValid = pictures.length > 0;

  const isFormValid = isAboutValid && isInterestsValid && isPicturesValid;

  useEffect(() => {
    if (geolocalistion.choice) {
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
          console.error("Error getting current location: ", error);
          if (error.code === error.PERMISSION_DENIED) {
            console.error("User denied geolocation permission");
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            console.error("Geolocation information is unavailable");
          } else if (error.code === error.TIMEOUT) {
            console.error("Geolocation request timed out");
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }, [geolocalistion.choice]);

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
          setGeolocalisation((prev) => ({
            ...prev,
            localistion: data.display_name,
          }));
        } catch (error) {
          console.error("Error reverse geocoding: ", error);
        }
      };
      reverseGeocode();
    }
  }, [currentLocation]);

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col gap-2 items-center w-full md:max-w-md mx-auto px-2">
        <div className="mt-3 text-3xl font-extrabold text-neutral mb-2">
          Informations
        </div>
        <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto overflow-x-hidden md:card md:w-[430px] flex flex-col items-center gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Gender *
            </legend>
            <select
              value={gender}
              className="select flex items-center gap-2
                px-3 py-2
                bg-primary-content
                transition-all duration-150
                w-full relative"
              onChange={(e) => setGender(e.target.value)}
            >
              <option>Woman</option>
              <option>Man</option>
            </select>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Sexual preferences *
            </legend>
            <select
              value={sexualPreferences}
              className="select flex items-center gap-2
                px-3 py-2
                bg-primary-content
                transition-all duration-150
                w-full relative"
              onChange={(e) => setSexualPreferences(e.target.value)}
            >
              <option>Men & Women</option>
              <option>Men</option>
              <option>Women</option>
            </select>
          </fieldset>
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Something about yourself : *
            </legend>
            <textarea
              className="textarea flex items-center gap-2
                px-3 py-2 bg-primary-content transition-all duration-150
                w-full relative"
              placeholder="Write something about yourself..."
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </fieldset>
          <TagsInput interests={interests} setInterests={setInterests} />
          <PicturesPicker
            pictures={pictures}
            setPictures={setPictures}
            profilePicIdx={profilePicIdx}
            setProfilePicIdx={setProfilePicIdx}
          />
          <button
            className="btn btn-primary shadow-lg font-bold
           text-lg px-8 py-3 mt-3 transition-all hover:scale-[1.03] active::scale-95 w-full"
            disabled={!isFormValid}
            onClick={() =>
              (
                document.getElementById(
                  "geolocalisation_modal"
                ) as HTMLDialogElement
              ).showModal()
            }
          >
            Submit
          </button>
          <dialog id="geolocalisation_modal" className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">One last step...</h3>
              <p className="py-4">
                Do you agree to allow Matcha to locate your GPS position ?
              </p>
              <div className="flex">
                <input
                  type="radio"
                  name="gps-radio"
                  className="radio"
                  defaultChecked
                  onClick={() =>
                    setGeolocalisation({ choice: true, localistion: "Prout" })
                  }
                />
                <p className="ms-4">Yes</p>
              </div>
              <div className="flex mt-4">
                <input
                  type="radio"
                  name="gps-radio"
                  className="radio"
                  onClick={() =>
                    setGeolocalisation({ choice: false, localistion: "" })
                  }
                />
                <p className="ms-4">No</p>
              </div>
              {geolocalistion.choice && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Type here"
                    className="input"
                    value={geolocalistion.localistion}
                    onChange={(e) =>
                      setGeolocalisation({
                        choice: true,
                        localistion: e.target.value,
                      })
                    }
                  />
                  <p className="label text-xs ms-3">
                    You can adjust the GPS position
                  </p>
                </div>
              )}
              <div className="modal-action">
                <button className="btn btn-primary">
                  <Link href={"/home"}>Submit</Link>
                </button>
                <form method="dialog">
                  <button className="btn">Close</button>
                </form>
              </div>
            </div>
          </dialog>
        </div>
      </div>
    </div>
  );
}
