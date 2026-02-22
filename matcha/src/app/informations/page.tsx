"use client";

import React, { useEffect, useState } from "react";
import TagsInput from "../../utils/TagInput";
import PicturesPicker from "../../utils/PicturePickers";
import { useRouter } from "next/navigation";
import api from "../../services/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export default function InformationsPage() {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useCurrentUser();
  const [interests, setInterests] = useState<string[]>([]);
  const [pictures, setPictures] = useState<File[]>([]);
  const [profilePicIdx, setProfilePicIdx] = useState<number>(0);
  const [gender, setGender] = useState<string>("Woman");
  const [sexualPreferences, setSexualPreferences] =
    useState<string>("Men & Women");
  const [about, setAbout] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

  const [gpsChoice, setGpsChoice] = useState<"pending" | "accepted" | "denied">(
    "pending",
  );
  const [manualLocation, setManualLocation] = useState<string>("");
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string>("");
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/");
    }
  }, [currentUser, authLoading, router]);

  if (authLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const isAboutValid = about.trim().length > 0;
  const isInterestsValid = interests.length > 0;
  const isPicturesValid = pictures.length > 0;
  const hasLocation =
    gpsChoice === "accepted" ? !!coordinates : manualLocation.trim().length > 0;

  const isFormValid = isAboutValid && isInterestsValid && isPicturesValid;

  const requestGPS = () => {
    setIsGpsLoading(true);
    setLocationError("");

    if (!navigator.geolocation) {
      setLocationError("GPS is not supported by your browser.");
      setGpsChoice("denied");
      setIsGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lon: longitude });
        setGpsChoice("accepted");

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=12`,
            { headers: { "User-Agent": "Matcha" } },
          );
          const data = await response.json();
          const address = data.address;
          setDetectedLocation(
            `${address.city || address.town || address.village || ""}, ${address.country || ""}`,
          );
        } catch {
          setDetectedLocation(
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          );
        }
        setIsGpsLoading(false);
      },
      (error) => {
        setIsGpsLoading(false);
        setGpsChoice("denied");
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(
            "Location access denied. Please enter your location manually.",
          );
        } else {
          setLocationError(
            "Unable to get your location. Please enter it manually.",
          );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const handleSubmit = async () => {
    if (!hasLocation) {
      setSubmitError("Please provide your location.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const profileResult = await api.updateProfile({
        gender: gender,
        orientation:
          sexualPreferences === "Men & Women"
            ? "likes men and women"
            : sexualPreferences === "Men"
              ? "likes men"
              : "likes women",
        bio: about,
      });

      if (profileResult.error) {
        setSubmitError(profileResult.error);
        setIsSubmitting(false);
        return;
      }

      if (interests.length > 0) {
        const tagsResult = await api.updateTags(interests);
        if (tagsResult.error) {
          console.error("Error updating tags:", tagsResult.error);
        }
      }

      if (gpsChoice === "accepted" && coordinates) {
        const locResult = await api.updateLocation(
          coordinates.lat,
          coordinates.lon,
        );
        if (locResult.error) {
          console.error("Error updating location:", locResult.error);
        }
      }

      for (let i = 0; i < pictures.length; i++) {
        const uploadResult = await api.uploadImage(pictures[i]);
        if (uploadResult.error) {
          console.error("Error uploading image:", uploadResult.error);
        } else if (i === profilePicIdx && uploadResult.data?.image_id) {
          await api.setProfilePicture(uploadResult.data.image_id);
        }
      }

      router.push("/home");
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitError("An error occurred while saving your profile.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-hero">
      <div className="flex flex-col gap-4 items-center w-full max-w-md mx-auto px-4 py-8 animate-fade-in">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-extrabold text-neutral mb-2">
            Complete Your Profile
          </h1>
          <p className="text-neutral/70">Tell us more about yourself</p>
        </div>
        <div className="glass rounded-3xl shadow-xl w-full px-6 py-8 flex flex-col gap-5 animate-slide-up">
          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Gender *
            </legend>
            <select
              value={gender}
              className="select w-full bg-white/80 rounded-xl border-0"
              onChange={(e) => setGender(e.target.value)}
            >
              <option>Woman</option>
              <option>Man</option>
            </select>
          </fieldset>

          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              Interested in *
            </legend>
            <select
              value={sexualPreferences}
              className="select w-full bg-white/80 rounded-xl border-0"
              onChange={(e) => setSexualPreferences(e.target.value)}
            >
              <option>Men & Women</option>
              <option>Men</option>
              <option>Women</option>
            </select>
          </fieldset>

          <fieldset className="fieldset w-full">
            <legend className="fieldset-legend text-sm font-semibold text-neutral pb-1">
              About you *
            </legend>
            <textarea
              className="textarea w-full bg-white/80 rounded-xl border-0 min-h-24"
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
            className="btn btn-primary btn-glow shadow-lg font-bold text-lg py-3 mt-2 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] w-full"
            disabled={!isFormValid}
            onClick={() =>
              (
                document.getElementById("gps_modal") as HTMLDialogElement
              ).showModal()
            }
          >
            Continue
          </button>
        </div>

        <dialog id="gps_modal" className="modal modal-bottom sm:modal-middle">
          <div className="modal-box glass rounded-3xl max-w-md">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📍</div>
              <h3 className="font-bold text-2xl text-neutral">
                Location Access
              </h3>
              <p className="text-neutral/70 mt-2">
                Help others find you nearby! We need your location to show you
                matches in your area.
              </p>
            </div>

            {gpsChoice === "pending" && (
              <div className="flex flex-col gap-4">
                <button
                  className="btn btn-primary btn-lg rounded-2xl w-full gap-2"
                  onClick={requestGPS}
                  disabled={isGpsLoading}
                >
                  {isGpsLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Detecting location...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Allow GPS Location
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost text-neutral/60"
                  onClick={() => setGpsChoice("denied")}
                >
                  I prefer to enter manually
                </button>
              </div>
            )}

            {gpsChoice === "accepted" && (
              <div className="bg-success/10 rounded-2xl p-4 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-semibold text-success">Location detected!</p>
                <p className="text-neutral/70 mt-1">{detectedLocation}</p>
              </div>
            )}

            {gpsChoice === "denied" && (
              <div className="flex flex-col gap-4">
                {locationError && (
                  <div className="alert alert-warning rounded-xl">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="text-sm">{locationError}</span>
                  </div>
                )}
                <fieldset className="fieldset w-full">
                  <legend className="fieldset-legend text-sm font-semibold">
                    Enter your city *
                  </legend>
                  <input
                    type="text"
                    className="input w-full bg-white/80 rounded-xl"
                    placeholder="e.g. Paris, France"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                  />
                </fieldset>
                <button
                  className="btn btn-ghost btn-sm text-primary"
                  onClick={() => {
                    setGpsChoice("pending");
                    setLocationError("");
                  }}
                >
                  ← Try GPS instead
                </button>
              </div>
            )}

            {submitError && (
              <div className="alert alert-error mt-4 rounded-xl">
                <span>{submitError}</span>
              </div>
            )}

            <div className="modal-action mt-6">
              <form method="dialog" className="w-full flex gap-3">
                <button className="btn btn-ghost flex-1 rounded-xl">
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary flex-1 rounded-xl"
                  disabled={!hasLocation || isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      </div>
    </div>
  );
}
