/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
"use client";
import Field from "@/utils/field";
import PicturesPicker from "../../../utils/picturePickers";
import TagsInput from "../../../utils/tagInput";
import React, { useState } from "react";

export default function Profile() {
  const [editMode, setEditMode] = useState<number>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [pictures, setPictures] = useState<File[]>([]);
  const [profilePicIdx, setProfilePicIdx] = useState<number>(0);
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email) && email.trim().length > 0;
  const isFirstNameValid = firstName.trim().length > 0;
  const isLastNameValid = lastName.trim().length > 0;

  return (
    <div className="flex flex-col gap-2 w-full md:max-w-md mx-auto">
      <div className="mt-20 text-xl font-extrabold ms-2">Profile</div>
      <div className="bg-base-100/95 shadow-lg w-screen px-6 py-8 overflow-y-auto overflow-x-hidden md:card md:w-[430px] flex flex-col md:flex-row gap-4 md:gap-6 h-[75vh] md:h-auto md:overflow-hidden">
        <ul className="list bg-base-100 rounded-box shadow-md">
          <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
            Informations
          </li>
          <li className="list-row">
            <div className="mt-2">Gender</div>
            {editMode === 1 ? (
              <>
                <fieldset className="fieldset w-full">
                  <select
                    className="select flex items-center gap-2
                px-3 py-2
                bg-primary-content
                transition-all duration-150
                w-full relative"
                  >
                    <option>Woman</option>
                    <option>Man</option>
                  </select>
                </fieldset>
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="mt-2">Woman</div>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(1)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>

          <li className="list-row">
            <div className="mt-2">Sexual Preferences</div>
            {editMode === 2 ? (
              <>
                <fieldset className="fieldset w-full">
                  <select
                    className="select flex items-center gap-2
                px-3 py-2
                bg-primary-content
                transition-all duration-150
                w-full relative"
                  >
                    <option>Men & Women</option>
                    <option>Men</option>
                    <option>Women</option>
                  </select>
                </fieldset>
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="mt-2">Men & Women</div>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(2)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>
          <li className="list-row">
            <div className="mt-2">Biography</div>
            {editMode === 3 ? (
              <>
                <textarea
                  className="textarea flex items-center gap-2
                px-3 py-2 bg-primary-content transition-all duration-150
                w-full relative"
                  placeholder="Write something about yourself..."
                />
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="mt-2">I am 25 years-old</div>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(3)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>
          <li className="list-row">
            <div className="mt-2">Interests</div>
            {editMode === 4 ? (
              <>
                <TagsInput
                  interests={interests}
                  setInterests={setInterests}
                  editMode={true}
                />
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="mt-2">#vegan, #geek, #piercing</div>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(4)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>
          <li className="list-row">
            <div className="mt-2">Pictures</div>
            {editMode === 5 ? (
              <>
                <PicturesPicker
                  pictures={pictures}
                  setPictures={setPictures}
                  profilePicIdx={profilePicIdx}
                  setProfilePicIdx={setProfilePicIdx}
                  removeTitle={true}
                />
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <PicturesPicker
                  pictures={pictures}
                  setPictures={setPictures}
                  profilePicIdx={profilePicIdx}
                  setProfilePicIdx={setProfilePicIdx}
                  displayMode={true}
                  removeTitle={true}
                />
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(5)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>
          <li className="list-row">
            <div className="mt-2">E-mail</div>
            {editMode === 6 ? (
              <>
                <Field
                  label=""
                  type="email"
                  placeholder="mail@site.com"
                  icon={
                    <svg
                      className="h-[1.2em] opacity-50"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                    >
                      <g
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        strokeWidth="2.5"
                        fill="none"
                        stroke="currentColor"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                      </g>
                    </svg>
                  }
                  hint={
                    !isEmailValid && email
                      ? "Email non valide"
                      : "Enter valid email address"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!isEmailValid && email ? "Invalid email format" : ""}
                  isValid={isEmailValid}
                />
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="mt-2">justineemunozz@gmail.com</div>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(6)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>
          <li className="list-row">
            <div className="mt-2">Firstname</div>
            {editMode === 7 ? (
              <>
                <Field
                  label=""
                  type="text"
                  placeholder="Firstname"
                  icon={null}
                  hint={!isFirstNameValid ? "Firstname is required" : ""}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  error={!isFirstNameValid ? "Firstname is required" : ""}
                  isValid={firstName.trim().length > 0}
                />
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="mt-2">Justine</div>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(7)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>
          <li className="list-row">
            <div className="mt-2">Lastname</div>
            {editMode === 8 ? (
              <>
                <Field
                  label=""
                  type="text"
                  placeholder="Lastname"
                  icon={null}
                  hint={!isLastNameValid ? "Lastname is required" : ""}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  error={!isLastNameValid ? "Lastname is required" : ""}
                  isValid={lastName.trim().length > 0}
                />
                {/* handle the set of the new gender value */}
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </button>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(0)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <div className="mt-2">Munoz</div>
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setEditMode(8)}
                  disabled={editMode !== 0}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                    />
                  </svg>
                </button>
              </>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}
