// =============================================================================
// API LAYER - Supabase Integration Functions
// =============================================================================

import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const API = {
  // Employee operations
  employees: {
    async getAll() {
      try {
        const { data, error } = await supabase.from("employees").select("*");
        if (error) throw error;
        return data || [];
      } catch (e) {
        console.log("Error fetching employees", e);
        return [];
      }
    },
    async create(employee) {
      try {
        const { data: updatedEmployee, error } = await supabase
          .from("employees")
          .insert([employee]);
        if (error) throw error;
        return updatedEmployee;
      } catch (e) {
        console.log("Error creating employee", e);
        return null;
      }
    },
    async update(id, updates) {
      try {
        const { error } = await supabase
          .from("employees")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.log("Error updating employees", e);
      }
    },
    async delete(id) {
      try {
        const { error } = await supabase
          .from("employees")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.log("Error updating employees", e);
      }
    },
  },

  // Inventory operations
  inventory: {
    async getAll() {
      try {
        const { data, error } = await supabase.from("inventory").select("*");
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    async create(item) {
      try {
        const { data, error } = await supabase.from("inventory").insert([item]);
        if (error) throw error;
        return data;
      } catch (e) {
        console.log("Error creating inventory item", e);
        return null;
      }
    },
    async update(id, updates) {
      try {
        const { error } = await supabase
          .from("inventory")
          .update(updates)
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.log("Error updating inventory", e);
      }
    },
    async delete(id) {
      try {
        const { error } = await supabase
          .from("inventory")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.log("Error deleting inventory item", e);
      }
    },
  },

  // Sales operations
  sales: {
    async getAll() {
      try {
        const { data, error } = await supabase.from("sales").select("*");
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    async create(sale) {
      try {
        const { data: insertedSale, error } = await supabase
          .from("sales")
          .insert([sale]);
        return insertedSale;
      } catch (e) {
        console.log("Error creating sale", e);
      }
    },
    async delete(id) {
      try {
        const { error } = await supabase.from("sales").delete().eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.log("Error deleting shift", e);
      }
    },
  },

  // Shifts operations
  shifts: {
    async getAll() {
      try {
        const { data, error } = await supabase.from("shifts").select("*");
        if (!data || error) throw error;
        return data;
      } catch {
        return [];
      }
    },
    async create(shift) {
      try {
        const { data: insertedShift, error } = await supabase
          .from("shifts")
          .insert([shift]);
        return insertedShift;
      } catch (e) {
        console.log("Error creating shift", e);
      }
    },
    async update(id, updates) {
      try {
        const { data, error } = await supabase
          .from("shifts")
          .update(updates)
          .eq("id", id);
      } catch (e) {
        console.log("Error updating shift", e);
      }
    },
    async delete(id) {
      try {
        const { error } = await supabase.from("shifts").delete().eq("id", id);
        if (error) throw error;
      } catch (e) {
        console.log("Error deleting shift", e);
      }
    },
  },

  // Payment info operations
  paymentInfo: {
    async get() {
      try {
        const { data, error } = await supabase
          .from("payment_info")
          .select("*")
          .single();
        return data
          ? data
          : {
              bit: { name: "", phone: "" },
              paybox: { name: "", phone: "" },
              bank_transfer: {
                name: "",
                bankName: "",
                bankNumber: "",
                branchNumber: "",
                accountNumber: "",
              },
            };
      } catch {
        return {
          bit: { name: "", phone: "" },
          paybox: { name: "", phone: "" },
          bank_transfer: {
            name: "",
            bankName: "",
            bankNumber: "",
            branchNumber: "",
            accountNumber: "",
          },
        };
      }
    },
    async update(info) {
      const { data, error } = await supabase.from("payment_info").upsert(info);
      if (error) throw error;
      return data;
    },
  },

  // Audit operations
  audits: {
    async getAll() {
      try {
        const { data, error } = await supabase.from("audits").select("*");
        if (error) throw error;
        return data;
      } catch {
        return [];
      }
    },
    async create(audit) {
      const { data, error } = await supabase.from("audits").insert([audit]);
      return data;
    },
  },
};

export default API;
