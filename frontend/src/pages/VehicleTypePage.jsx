import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getVehicleTypes,
  addVehicleType,
  updateVehicleType,
  deactivateVehicleType,
  reactivateVehicleType,
} from "../services/VehicleTypeService";

import "../styles/vehicleTypes.css";

const emptyForm = {
  typeName: "",
  description: "",
};

export default function VehicleTypePage() {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingID, setEditingID] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadTypes() {
      setLoading(true);
      setError("");

      try {
        const rows = await getVehicleTypes(includeInactive);

        if (!cancelled) {
          setVehicleTypes(rows);
        }
      } catch (err) {
        if (!cancelled) {
          setVehicleTypes([]);
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTypes();

    return () => {
      cancelled = true;
    };
  }, [includeInactive, reloadKey]);

  function openAddForm() {
    setEditingID(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(vehicleType) {
    setEditingID(vehicleType.vehicleTypeID);
    setForm({
      typeName: vehicleType.typeName,
      description: vehicleType.description,
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingID(null);
    setForm({ ...emptyForm });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const model = {
      typeName: form.typeName.trim(),
      description: form.description.trim() || null,
    };

    if (!model.typeName) {
      setError("Vehicle type name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editingID !== null) {
        await updateVehicleType(editingID, model);
        setSuccess("Vehicle type updated successfully.");
      } else {
        await addVehicleType(model);
        setSuccess("Vehicle type added successfully.");
      }

      closeForm();
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(vehicleType) {
    const deactivate = vehicleType.activeStatus;
    const action = deactivate ? "deactivate" : "reactivate";

    if (
      !window.confirm(
        `Do you want to ${action} "${vehicleType.typeName}"?`
      )
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (deactivate) {
        await deactivateVehicleType(vehicleType.vehicleTypeID);
      } else {
        await reactivateVehicleType(vehicleType.vehicleTypeID);
      }

      setSuccess(
        `Vehicle type ${deactivate ? "deactivated" : "reactivated"} successfully.`
      );

      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="vt-page">
      <Link to="/dashboard" className="vt-back">
        ← Back to Dashboard
      </Link>

      <div className="vt-heading">
        <div>
          <h1>Vehicle Types</h1>
          <p>Manage vehicle types such as Car, Van, and Motorcycle.</p>
        </div>

        <button
          type="button"
          className="vt-button vt-primary"
          onClick={openAddForm}
          disabled={saving}
        >
          + Add New Vehicle Type
        </button>
      </div>

      {error && (
        <div className="vt-message vt-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="vt-message vt-success" role="status">
          {success}
        </div>
      )}

      {showForm && (
        <section className="vt-card">
          <h2>
            {editingID !== null
              ? "Edit Vehicle Type"
              : "Add New Vehicle Type"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="vt-field">
              <label htmlFor="typeName">Vehicle Type Name *</label>
              <input
                id="typeName"
                name="typeName"
                value={form.typeName}
                onChange={handleChange}
                maxLength={100}
                placeholder="Example: Car"
                required
                disabled={saving}
              />
            </div>

            <div className="vt-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={500}
                rows={3}
                placeholder="Example: Passenger cars"
                disabled={saving}
              />
            </div>

            <div className="vt-actions">
              <button
                type="submit"
                className="vt-button vt-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                className="vt-button vt-secondary"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="vt-card">
        <div className="vt-list-heading">
          <h2>
            {includeInactive ? "All Vehicle Types" : "Active Vehicle Types"}
          </h2>

          <label className="vt-checkbox">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) =>
                setIncludeInactive(event.target.checked)
              }
              disabled={saving}
            />
            Include inactive types
          </label>
        </div>

        {loading ? (
          <p role="status">Loading vehicle types...</p>
        ) : (
          <div className="vt-table-wrapper">
            <table className="vt-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {vehicleTypes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="vt-empty">
                      {error
                        ? "Vehicle types could not be loaded."
                        : "No vehicle types found."}
                    </td>
                  </tr>
                ) : (
                  vehicleTypes.map((vehicleType) => (
                    <tr key={vehicleType.vehicleTypeID}>
                      <td>{vehicleType.vehicleTypeID}</td>
                      <td>{vehicleType.typeName}</td>
                      <td>{vehicleType.description || "—"}</td>
                      <td>
                        <span
                          className={`vt-status ${
                            vehicleType.activeStatus
                              ? "vt-active"
                              : "vt-inactive"
                          }`}
                        >
                          {vehicleType.activeStatus
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="vt-actions">
                          <button
                            type="button"
                            className="vt-button vt-secondary"
                            onClick={() => openEditForm(vehicleType)}
                            disabled={saving}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={`vt-button ${
                              vehicleType.activeStatus
                                ? "vt-danger"
                                : "vt-primary"
                            }`}
                            onClick={() =>
                              handleStatusChange(vehicleType)
                            }
                            disabled={saving}
                          >
                            {vehicleType.activeStatus
                              ? "Deactivate"
                              : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}