import React from "react";

export default function AdditionalGuestsInput({
  guests,
  onChange,
  disabled = false,
  numberOfAdults = 1,
  numberOfChildren = 0,
}) {
  // Calculate additional guests (excluding main guest)
  const additionalAdults = Math.max(0, numberOfAdults - 1);
  const additionalChildren = numberOfChildren;

  // Split guests into adults and children
  const adultGuests = guests
    .filter((guest) => !guest.isChild)
    .slice(0, additionalAdults);
  const childGuests = guests
    .filter((guest) => guest.isChild)
    .slice(0, additionalChildren);

  // Pad arrays to match required length
  while (adultGuests.length < additionalAdults) {
    adultGuests.push({
      gender: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      identificationNumber: "",
      nationality: "",
      isChild: false,
    });
  }

  while (childGuests.length < additionalChildren) {
    childGuests.push({
      gender: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      identificationNumber: "",
      nationality: "",
      isChild: true,
    });
  }

  const handleInputChange = (isChild, localIndex, field) => (e) => {
    const value = e.target.value;

    // Create a new array by mapping existing guests and updating the correct one
    let updatedGuests = [...guests];

    // Find the correct guest to update based on isChild flag and local index
    let guestToUpdateIndex = -1;

    if (isChild) {
      // For children, find the localIndex-th child in the guests array
      let childCount = 0;
      for (let i = 0; i < updatedGuests.length; i++) {
        if (updatedGuests[i].isChild) {
          if (childCount === localIndex) {
            guestToUpdateIndex = i;
            break;
          }
          childCount++;
        }
      }

      // If child not found but we need to add one, add at the end
      if (guestToUpdateIndex === -1 && localIndex === childCount) {
        updatedGuests.push({
          gender: "",
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          identificationNumber: "",
          nationality: "",
          isChild: true,
        });
        guestToUpdateIndex = updatedGuests.length - 1;
      }
    } else {
      // For adults, find the localIndex-th adult in the guests array
      let adultCount = 0;
      for (let i = 0; i < updatedGuests.length; i++) {
        if (!updatedGuests[i].isChild) {
          if (adultCount === localIndex) {
            guestToUpdateIndex = i;
            break;
          }
          adultCount++;
        }
      }

      // If adult not found but we need to add one, add at the end
      if (guestToUpdateIndex === -1 && localIndex === adultCount) {
        updatedGuests.push({
          gender: "",
          firstName: "",
          lastName: "",
          dateOfBirth: "",
          identificationNumber: "",
          nationality: "",
          isChild: false,
        });
        guestToUpdateIndex = updatedGuests.length - 1;
      }
    }

    // Update the guest if found
    if (guestToUpdateIndex !== -1) {
      updatedGuests[guestToUpdateIndex] = {
        ...updatedGuests[guestToUpdateIndex],
        [field]: value,
      };

      // Call the parent's onChange with the updated array
      onChange(guestToUpdateIndex, field, value);
    }
  };

  const renderGuestSection = (sectionGuests, isChildSection, sectionTitle) => {
    if (sectionGuests.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{sectionTitle}</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sectionGuests.map((guest, localIndex) => (
            <div
              key={`${isChildSection ? "child" : "adult"}-${localIndex}`}
              className="w-full border p-4 rounded-md relative space-y-3"
            >
              {/* Row 1: Họ và Tên */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Họ</label>
                  <input
                    type="text"
                    name="lastName"
                    value={guest.lastName}
                    onChange={handleInputChange(
                      isChildSection,
                      localIndex,
                      "lastName"
                    )}
                    disabled={disabled}
                    className={`w-full p-2 border border-black rounded-md ${
                      disabled ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    placeholder="Nguyễn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">Tên</label>
                  <input
                    type="text"
                    name="firstName"
                    value={guest.firstName}
                    onChange={handleInputChange(
                      isChildSection,
                      localIndex,
                      "firstName"
                    )}
                    disabled={disabled}
                    className={`w-full p-2 border border-black rounded-md ${
                      disabled ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    placeholder="Văn A"
                  />
                </div>
              </div>

              {/* Row 2: Giới tính và Ngày sinh */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Giới tính</label>
                  <select
                    name="gender"
                    value={guest.gender || ""}
                    onChange={handleInputChange(
                      isChildSection,
                      localIndex,
                      "gender"
                    )}
                    disabled={disabled}
                    className={`w-full p-2 border border-black rounded-md ${
                      disabled ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium">Ngày sinh</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={guest.dateOfBirth || ""}
                    onChange={handleInputChange(
                      isChildSection,
                      localIndex,
                      "dateOfBirth"
                    )}
                    disabled={disabled}
                    className={`w-full p-2 border border-black rounded-md ${
                      disabled ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Row 3: Số giấy tờ và Quốc tịch (chỉ cho người lớn) */}
              {!isChildSection && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        disabled ? "text-gray-400" : ""
                      }`}
                    >
                      Số giấy tờ
                    </label>
                    <input
                      type="text"
                      name="identificationNumber"
                      value={guest.identificationNumber}
                      onChange={handleInputChange(
                        isChildSection,
                        localIndex,
                        "identificationNumber"
                      )}
                      disabled={disabled}
                      className={`w-full p-2 border border-black rounded-md ${
                        disabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium ${
                        disabled ? "text-gray-400" : ""
                      }`}
                    >
                      Quốc tịch
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={guest.nationality}
                      onChange={handleInputChange(
                        isChildSection,
                        localIndex,
                        "nationality"
                      )}
                      disabled={disabled}
                      className={`w-full p-2 border border-black rounded-md ${
                        disabled ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Don't render anything if no additional guests
  if (additionalAdults === 0 && additionalChildren === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Khách đi cùng</h2>

      {renderGuestSection(adultGuests, false, "Người lớn")}
      {renderGuestSection(childGuests, true, "Trẻ em")}
    </div>
  );
}
