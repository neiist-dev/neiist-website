export interface ShopManagementDict {
  title: string;
  pos_link: string;
  add_product: string;
  search_placeholder: string;
  all_categories: string;
  no_image: string;
  view_image: string;
  limited: string;
  on_demand: string;
  in_stock: string;
  edit: string;
  remove: string;
  confirm_remove: string;
  view_active: string;
  archived: string;
  no_products_found: string;
  adjust_filters: string;
  no_archived_products: string;
  no_archived_products_hint: string;
  no_products: string;
  no_products_hint: string;
  confirm_archive: string;
  confirm_restore: string;
  confirm_permanent: string;
  error_generic: string;
  confirm_dialog: ConfirmDialogDict;
  categories: Record<string, string>;
}

export interface ConfirmDialogDict {
  confirm: string;
  cancel: string;
}

export interface ProductFormDict {
  unknown_error: string;
  edit: string;
  add_product: string;
  back_button: string;
  images_label: string;
  no_image: string;
  upload_image_label: string;
  product_name_placeholder: string;
  product_price_placeholder: string;
  product_description_placeholder: string;
  choose_categories: string;
  new_category_placeholder: string;
  add_category_button: string;
  limited_stock: string;
  on_demand_stock: string;
  product_quantity_placeholder: string;
  limit_date_placeholder: string;
  option_types: string;
  option_placeholder: string;
  variants_label: string;
  no_variants: string;
  extra_price: string;
  stock_placeholder: string;
  upload: string;
  saving: string;
  save_changes: string;
  create_product: string;
  error_create_category: string;
  error_create_category2: string;
  error_name_missing: string;
  error_category_missing: string;
  error_variant1: string;
  error_variant2: string;
  error_color1: string;
  error_color2: string;
  error_saving_product: string;
  error: string;
  default_option_color: string;
  default_option_size: string;
  stock_type_label: string;
  stock: string;
  add_button: string;
  groups_tab: string;
  combos_tab: string;
  show_secundary_groups: string;
}
export interface JoinsUsDict {
    title: string; 
    description: string;
    apply: string;
  }

export interface HeroHeroDict {
    teams_title: string;
    description: string;
    title_segments: string[];
    title: string;
    team_label: string;
    close_label: string;
    team_image_alt: string;
  }

export interface YearSelectorDict {
    nav_label: string;
    prev_label: string;
    next_label: string;
  }

export interface MemberCardDict {
    github_label: string;
    linkedin_label: string;
    photo_alt: string;
  }

export interface InputDateDialogDict {
    hint: string;
    confirm: string;
    cancel: string;
  }

export interface LoginButtonDict { 
    button: string;
  }

export interface NavBarDict {
    about_us: string;
    activities: string;
    shop: string;
    dinner: string;
    layout_navbar: {
      button: string;
      theme_toggle_light: string;
      theme_toggle_dark: string;
    };
    menu: {
      profile: string;
      my_orders: string;
      manage_orders: string;
      manage_team: string;
      manage_photos: string;
      manage_shop: string;
      manage_users: string;
      manage_departments: string;
      logout: string;
      user_photo_alt: string;
    };
  }

export interface DinnerDict {
    not_found: string;
    signed_up_message: string;
    unlock_time_message: string;
    unlock_highlight: string;
    unlocked_message: string;
    description: string;
    buy_button: string;
    poster_alt: string;
    location_label: string;
    date_label: string;
    date_value: string;
    time_label: string;
    time_value: string;
    location_value: string;
    location_url: string;
  }

export interface ThemeToggleDict {
    theme_toggle_light: string;
    theme_toggle_dark: string;
  }

export interface UserMenuDict {
    profile: string;
    my_orders: string;
    manage_orders: string;
    manage_team: string;
    manage_photos: string;
    manage_shop: string;
    manage_users: string;
    manage_departments: string;
    logout: string;
    user_photo_alt: string;
  }

export interface CalendarDict {
    toolbar:{
    today: string;
    previous_month: string;
    next_month: string;
    };
    details: any;
  }

export interface IconPickerDict {
    icon_picker: {
      title: string;
      search_placeholder: string;
      close_label: string;
    };
  }

export interface AboutUsEditorDict {
    nav_label: string;
    prev_label: string;
    next_label: string;
    title: string;
    no_member: string;
    photo_alt: string;
  }

export interface AddDepartmentModalDict {
    add_team_button: string;
    add_body_button: string;
    new_team_title: string;
    new_body_title: string;
    team_name_placeholder: string;
    body_name_placeholder: string;
    team_desc_placeholder: string;
    next: string;
    add_roles_title: string;
    remove: string;
    back: string;
    creating: string;
    create_department: string;
    errors: {
      create_department: string;
      create_role: string;
      create_department_or_roles: string;
    };
    role_form: {
      role_name_placeholder: string;
      add_role: string;
      access: {
        guest: string;
        member: string;
        coordinator: string;
        admin: string;
      };
    };
  }

export interface RolesSearchFilterDict {
    title: string;
    existing_roles_title: string;
    all: string;
    search_placeholder: string;
    active: string;
    show_inactive: string;
    empty_all: string;
    empty_select: string;
    active_badge: string;
    inactive_badge: string;
    remove: string;
    add_role_title: string;
    role_name_placeholder: string;
    adding: string;
    add_role: string;
    confirm_remove: string;
    access: {
        guest: string;
        member: string;
        shop_manager: string;
        coordinator: string;
        admin: string;
    };
    errors: {
        add_role: string;
        remove_role: string;
    };
    confirm_dialog: {
      confirm: string;
      cancel: string;
    };
  }

export interface AdminBodiesSearchFilterDict {
    section_title: string;
    search_placeholder: string;
    active: string;
    show_inactive: string;
    empty: string;
    inactive_badge: string;
    deactivate_title: string;
    deactivate: string;
  }

export interface UsersSearchListDict {
    title: string;
    search_placeholder: string;
    empty: string;
    photo_alt: string;
    email_label: string;
    phone_label: string;
    courses_label: string;
    teams_label: string;
  }

export interface TeamsSearchFilterDict {
    title: string;
    section_title: string;
    search_placeholder: string;
    active: string;
    show_inactive: string;
    empty: string;
    inactive_badge: string;
    deactivate_title: string;
    deactivate: string;
  }

export interface MembershipsSearchListDict {
    add_member_title: string;
    select_user: string;
    select_department: string;
    select_role: string;
    adding: string;
    add_member: string;
    existing_members_title: string;
    search_placeholder: string;
    active: string;
    show_inactive: string;
    empty: string;
    change_photo: string;
    change_photo_inactive: string;
    department_label: string;
    role_label: string;
    email_label: string;
    since_label: string;
    until_label: string;
    active_badge: string;
    inactive_badge: string;
    remove: string;
    confirm_remove: string;
    errors: {
      add_member: string;
      remove_member: string;
    };
    confirm_dialog: {
      confirm: string;
      cancel: string;
    };
  }

export interface SweatsContestDict {
    title: string;
    description_start: string;
    description_consult: string;
    description_link: string;
    description_end: string;
    button: string;
    uploading: string;
    submitted: string;
    login_warning: string;
    errors: { 
      zip_only: string; 
      upload: string };
  }

export interface HeroDict {
    campus_alt: string;
    student_alt: string;
    title_prefix: string;
    title_letters: string[];
    title_suffix: string;
  }

export interface PartnershipsDict {
    title: string;
  }

export interface ActivitiesDict {
    title: string;
    no_events: string;
    prev_label: string;
    next_label: string;
    events: {
      [key : string]: {
        title: string;
        description: string;
      };
    };
  }

export interface SinfoDict { title: string; button: string; description: string; objective: string }

export interface PhotoTeamMembersDict {
    search_placeholder: string;
    empty: string;
    change_photo_title: string;
  }

export interface SumUpReadersManagementDict {
    sumup_readers: {
      pairing_code_label: string;
      pairing_code_placeholder: string;
      reader_name_label: string;
      reader_name_placeholder: string;
      add_button: string;
      loading: string;
      no_readers: string;
      remove_button: string;
      added_success1: string;
      added_success2: string;
      removed_success: string;
      pairing_code_required: string;
      table_id: string;
      table_name: string;
      table_status: string;
      table_model: string;
      table_actions: string;
      fetch_error: string;
      create_error: string;
      delete_error: string;
    };
    confirm_dialog: {
      title: string;
      confirm: string;
      cancel: string;
    };
  }

export interface DateFilterDict {
    title: string;
    until: string;
    range: string;
    days: string[];
  }

export interface OrderDetailsOverlayDict {
    order_details: {
      close_label: string;
      order_title: string;
      not_found: string;
      col_name: string;
      col_ist_id: string;
      col_campus: string;
      col_email: string;
      col_phone: string;
      items_title: string;
      edit_items_label: string;
      col_product: string;
      col_variant: string;
      col_qty: string;
      col_price: string;
      col_total: string;
      add_notes: string;
      total_label: string;
      notes_title: string;
      status_title: string;
      pay_btn: string;
      mark_ready: string;
      mark_delivered: string;
      cancel_order: string;
      created_by: string;
      payment_verified_by: string;
      pickup_deadline: string;
      delivered_by: string;
      step_pending: string;
      step_paid: string;
      step_ready: string;
      step_delivered: string;
      confirm_cancel: string;
      confirm_status: string;
      confirm_save_notes: string;
      error_update_status: string;
      error_cancel: string;
      error_save_notes: string;
      success_save_notes: string;
      pickup_toast: string;
      payment_reference_label: string;
      register_payment: string;
      finalize_order: string;
    };
    confirm_dialog: { confirm: string; cancel: string };
    new_order_modal: Record<string, unknown>;
    create_user_modal: Record<string, unknown>;
    pos_payment: PosPaymentDict;
  }

export interface NewOrderModalDict {
    new_order_modal: {
      title_create: string;
      title_edit: string;
      user_label: string;
      user_placeholder: string;
      user_not_found: string;
      user_create_new: string;
      products_label: string;
      products_placeholder: string;
      campus_label: string;
      campus_placeholder: string;
      campus_alameda: string;
      campus_taguspark: string;
      nif_label: string;
      nif_placeholder: string;
      phone_label: string;
      phone_placeholder: string;
      notes_label: string;
      notes_placeholder: string;
      cancel: string;
      submitting_create: string;
      submitting_edit: string;
      submit_create: string;
      submit_edit: string;
      confirm_create: string;
      confirm_edit: string;
      confirm_stock_override: string;
      error_no_products: string;
      error_no_campus: string;
      error_no_user: string;
      error_create: string;
      error_update: string;
      guest_confirm: string;
      guest_title: string;
      guest_name_label: string;
      guest_name_placeholder: string;
      guest_email_label: string;
      guest_email_placeholder: string;
      guest_phone_label: string;
      guest_phone_placeholder: string;
      errors: {
        no_products: string;
        no_campus: string;
        mixed_invalid: string;
        guest_name: string;
        guest_email: string;
        guest_phone: string;
      };
    };
    create_user_modal: {
      title: string;
      ist_id_label: string;
      ist_id_placeholder: string;
      name_label: string;
      name_placeholder: string;
      email_label: string;
      email_placeholder: string;
      cancel: string;
      submitting: string;
      submit: string;
      confirm_message_1: string;
      confirm_message_2: string;
      error_required: string;
      error_create: string;
    };
    confirm_dialog: {
      title: string;
      confirm: string;
      cancel: string;
    };
  }

export interface ActiveFiltersDict {
    label: string;
    clear_all: string;
    from: string;
    until: string;
    remove_date_range: string;
    remove_filter: string;
  }

export interface CartDict {
    close_label: string;
    title: string;
    empty: string;
    total: string;
    checkout: string;
  }

export interface CreateNewUserModalDict {
    title: string;
    ist_id_label: string;
    ist_id_placeholder: string;
    name_label: string;
    name_placeholder: string;
    email_label: string;
    email_placeholder: string;
    cancel: string;
    submitting: string;
    submit: string;
    confirm_message_1: string;
    confirm_message_2: string;
    error_required: string;
    error_create: string;
  }

export interface OrdersTableDict {
    orders_table: {
      title_1: string;
      title_2: string;
      title_3: string;
      title_4: string;
      search_placeholder: string;
      export_button: string;
      new_order_button: string;
      filters_title: string;
      send_email_selected: string;
      send_email: string;
      set_pickup_deadline_title: string;
      set_pickup_deadline: string;
      processing: string;
      mark_paid: string;
      mark_ready: string;
      mark_delivered: string;
      cancel_orders: string;
      order_singular: string;
      order_plural: string;
      selected_singular: string;
      selected_plural: string;
      bulk_confirm_1: string;
      bulk_confirm_2: string;
      bulk_confirm_3: string;
      bulk_confirm_4: string;
      unknown_campus: string;
      export_filename: string;
      no_orders: string;
      pickup_dialog_title: string;
      col_number: string;
      col_date: string;
      col_name: string;
      col_campus: string;
      col_email: string;
      col_products: string;
      col_total: string;
      col_status: string;
      filter_products: string;
      filter_campus: string;
      filter_status: string;
      export_number: string;
      export_date: string;
      export_name: string;
      export_email: string;
      export_nif: string;
      export_ist_id: string;
      export_campus: string;
      export_phone: string;
      export_status: string;
      export_payment_method: string;
      export_payment_reference: string;
      export_total: string;
      export_notes: string;
      export_products: string;
      export_updated_by: string;
      export_sheet_orders: string;
      export_sheet_details: string;
      export_sheet_campus_inventory: string;
      export_sheet_campus_date: string;
      export_col_model: string;
      export_col_color: string;
      export_col_size: string;
      export_col_quantity: string;
    };
    confirm_dialog: {
      title: string;
      confirm: string;
      cancel: string;
    };
    input_date_dialog: {
      hint: string;
      confirm: string;
      cancel: string;
    };
    active_filters: {
      label: string;
      clear_all: string;
      from: string;
      until: string;
      remove_date_range: string;
      remove_filter: string;
    };
    new_order_modal: {
      title_create: string;
      title_edit: string;
      user_label: string;
      user_placeholder: string;
      user_not_found: string;
      user_create_new: string;
      products_label: string;
      products_placeholder: string;
      campus_label: string;
      campus_placeholder: string;
      campus_alameda: string;
      campus_taguspark: string;
      nif_label: string;
      nif_placeholder: string;
      phone_label: string;
      phone_placeholder: string;
      notes_label: string;
      notes_placeholder: string;
      cancel: string;
      submitting_create: string;
      submitting_edit: string;
      submit_create: string;
      submit_edit: string;
      confirm_create: string;
      confirm_edit: string;
      confirm_stock_override: string;
      error_no_products: string;
      error_no_campus: string;
      error_no_user: string;
      error_create: string;
      error_update: string;
      guest_confirm: string;
      guest_title: string;
      guest_name_label: string;
      guest_name_placeholder: string;
      guest_email_label: string;
      guest_email_placeholder: string;
      guest_phone_label: string;
      guest_phone_placeholder: string;
      errors: {
        no_products: string;
        no_campus: string;
        mixed_invalid: string;
        guest_name: string;
        guest_email: string;
        guest_phone: string;
      };
    };
    create_user_modal: {
      title: string;
      ist_id_label: string;
      ist_id_placeholder: string;
      name_label: string;
      name_placeholder: string;
      email_label: string;
      email_placeholder: string;
      cancel: string;
      submitting: string;
      submit: string;
      confirm_message_1: string;
      confirm_message_2: string;
      error_required: string;
      error_create: string;
    };
    date_filter: {
      title: string;
      until: string;
      range: string;
      days: string[];
    };
    mobile_filters_drawer: {
      title: string;
      close_label: string;
      date_section: string;
      until: string;
      range: string;
      days: string[];
      products_section: string;
      campus_section: string;
      status_section: string;
      clear_all: string;
      apply: string;
    };
    pos_payment: PosPaymentDict;
  }

export interface PosPaymentOverlayDict {
    pos_payment: PosPaymentDict;
    confirm_dialog: { confirm: string; cancel: string };
  }

export interface MobileFiltersDrawerDict {
    title: string;
    close_label: string;
    date_section: string;
    until: string;
    range: string;
    days: string[];
    products_section: string;
    campus_section: string;
    status_section: string;
    clear_all: string;
    apply: string;
  }

export interface CheckoutFormDict {
    empty_cart: string;
    section_personal: string;
    phone_label: string;
    phone_placeholder: string;
    nif_label: string;
    nif_placeholder: string;
    section_delivery: string;
    section_campus: string;
    section_payment: string;
    section_notes: string;
    notes_placeholder: string;
    processing: string;
    submit: string;
    apple_pay_label: string;
    summary_title: string;
    subtotal: string;
    iva: string;
    total: string;
    tax_info: string;
    tax_info_detail: string;
    delivery_estimate: string;
    delivery_detail: string;
    campus_alameda: string;
    campus_taguspark: string;
    payment_card: string;
    payment_in_person: string;
    error_no_campus: string;
    error_no_payment: string;
    error_mixed_invalid: string;
    error_submit: string;
    error_apple_pay_context: string;
    error_apple_pay_unavailable: string;
    error_apple_pay_device: string;
    error_apple_pay_failed: string;
    error_apple_pay_processing: string;
    error_checkout_create: string;
    error_checkout_unexpected: string;
    error_applepay_validation: string;
    error_payment_incomplete: string;
  }

export interface PosPaymentDict {
  close_label: string;
  title: string;
  title_register_payment: string;
  method_label: string;
  method_cash: string;
  method_other: string;
  method_sumup_tpa: string;
  method_sumup: string;
  method_apple_pay: string;
  method_in_person: string;
  method_mbway: string;
  reference_label: string;
  reference_placeholder: string;
  reader_label: string;
  loading_readers: string;
  select_reader: string;
  cancel: string;
  confirm_btn: string;
  success_title: string;
  processing_terminal_title: string;
  processing_payment_title: string;
  success_subtitle: string;
  awaiting_subtitle: string;
  view_orders: string;
  error_load_readers: string;
  error_update_order: string;
  error_mark_paid: string;
  awaiting_terminal: string;
  select_reader_error: string;
  starting_payment: string;
  checkout_started: string;
  payment_initiated_toast: string;
  failed_terminal: string;
  payment_sent: string;
  processing_payment: string;
  fill_reference: string;
  payment_confirmed: string;
  error_payment: string;
  confirm_cash: string;
  confirm_mbway: string;
  confirm_reference: string;
  mbway_send_to: string;
  mbway_number_unavailable: string;
}
