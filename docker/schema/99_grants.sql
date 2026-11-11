-- Object-specific grants. Must run after all functions exist.

-- Only necessary permissions to specific read only user
GRANT EXECUTE ON FUNCTION neiist.get_products(INTEGER, neiist.sales_channel_enum, BOOLEAN) TO neiist_readonly;
GRANT EXECUTE ON FUNCTION neiist.get_all_categories() TO neiist_readonly;
